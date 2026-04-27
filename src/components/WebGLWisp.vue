<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { wispState } from '../composables/wispState';

const canvasRef = ref<HTMLCanvasElement | null>(null);

let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let renderer: THREE.WebGLRenderer;
let material: THREE.ShaderMaterial;
let plane: THREE.Mesh;
let animationFrameId: number;

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_position;
  uniform vec2 u_size;
  uniform float u_hoverIntensity;
  uniform float u_clickIntensity;
  uniform float u_seed;

  varying vec2 vUv;

  float hash(vec2 p) { return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) * (0.1 + abs(sin(p.y * 13.0 + p.x)))); }
  
  float noise(vec2 x) {
    vec2 i = floor(x); vec2 f = fract(x);
    float a = hash(i); float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  float fbm(vec2 x) {
    float v = 0.0; float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * noise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
      if (u_hoverIntensity < 0.01) {
          gl_FragColor = vec4(0.0);
          return;
      }

      // 1. TIME QUANTIZATION (12fps)
      float fpsTime = floor(u_time * 12.0) / 12.0;

      // 2. COORDINATE MAPPING (Global Canvas -> Local Button UVs)
      vec2 pixelCoords = vUv * u_resolution;
      vec2 center = vec2(u_position.x + u_size.x * 0.5, (u_resolution.y - u_position.y) - u_size.y * 0.5);
      vec2 offset = pixelCoords - center;
      
      float pulseScale = 1.0 - (u_clickIntensity * 0.15);
      offset *= pulseScale;

      // nPos acts as the local 'uv' from -1 to 1 based on button size + bleed room
      // We expand the bounding box by 2.0 to give plenty of room for the wisp
      vec2 nPos = offset / (u_size * 0.8);

      // 3. THE CONTAINER MASK
      // Creates a horizontal pill shape fading at the edges
      float maskY = smoothstep(0.9, 0.1, abs(nPos.y)); 
      float maskX = smoothstep(1.0, 0.3, abs(nPos.x));
      
      // Add jagged distortion to the mask itself so it isn't a perfect oval
      float shapeDistort = fbm(nPos * 2.0 + fpsTime + u_seed) * 0.5;
      float baseMask = smoothstep(0.4, 0.6, (maskY * maskX) + shapeDistort);

      // 4. THE FLUID PANNING
      // Pan two noise layers in slightly different directions
      vec2 flow1 = vec2(fpsTime * 1.5, fpsTime * 0.2);
      vec2 flow2 = vec2(fpsTime * 0.8, -fpsTime * 0.1);

      float n1 = fbm(nPos * 4.0 - flow1 + u_seed);
      float n2 = fbm(nPos * 5.0 - flow2 + u_seed * 2.0);

      // Combine them to create fluid tearing/merging
      float fluid = n1 * n2;

      // 5. THE THRESHOLD (The Hard Ink)
      // If the fluid * mask is above 0.2, make it solid ink. Otherwise, transparent.
      float inkShape = step(0.2, fluid * baseMask);

      // 6. INTERNAL GRIT
      // Generate tiny flowing specs to overlay on the ink
      float grit = step(0.65, fbm(nPos * 40.0 - vec2(fpsTime * 2.0, 0.0) + u_seed));
      
      // Spectral Green (#45F0D1 => RGB 0.27, 0.94, 0.82)
      vec3 inkColor = vec3(0.27, 0.94, 0.82);
      
      // Darken the ink where the grit particles are
      inkColor -= grit * 0.4;

      // Chromatic Aberration at edges (red/blue fringing)
      float edgeR = step(0.18, fluid * baseMask) - inkShape;
      float edgeB = step(0.22, fluid * baseMask) - inkShape;
      
      inkColor.r += edgeR * 0.8;
      inkColor.b += edgeB * 0.8;

      float inkAlpha = inkShape * u_hoverIntensity;

      gl_FragColor = vec4(inkColor * inkAlpha, inkAlpha);
  }
`;

onMounted(() => {
  if (!canvasRef.value) return;

  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  
  renderer = new THREE.WebGLRenderer({ 
    canvas: canvasRef.value, 
    alpha: true,
    premultipliedAlpha: false,
    antialias: false
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  
  const updateSize = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    if (material) {
      material.uniforms.u_resolution.value.set(width, height);
    }
  };
  
  window.addEventListener('resize', updateSize);
  
  material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      u_time: { value: 0.0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_position: { value: new THREE.Vector2(0, 0) },
      u_size: { value: new THREE.Vector2(0, 0) },
      u_hoverIntensity: { value: 0.0 },
      u_clickIntensity: { value: 0.0 },
      u_seed: { value: 0.0 }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  plane = new THREE.Mesh(geometry, material);
  scene.add(plane);

  updateSize();

  const clock = new THREE.Clock();

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    
    material.uniforms.u_time.value = clock.getElapsedTime();
    
    if (wispState.hoverIntensity > 0) {
      material.uniforms.u_position.value.x += (wispState.rect.x - material.uniforms.u_position.value.x) * 0.2;
      material.uniforms.u_position.value.y += (wispState.rect.y - material.uniforms.u_position.value.y) * 0.2;
      material.uniforms.u_size.value.x += (wispState.rect.width - material.uniforms.u_size.value.x) * 0.2;
      material.uniforms.u_size.value.y += (wispState.rect.height - material.uniforms.u_size.value.y) * 0.2;
    }
    
    material.uniforms.u_hoverIntensity.value += (wispState.hoverIntensity - material.uniforms.u_hoverIntensity.value) * 0.15;
    material.uniforms.u_clickIntensity.value += (wispState.clickIntensity - material.uniforms.u_clickIntensity.value) * 0.2;
    wispState.clickIntensity *= 0.9;
    material.uniforms.u_seed.value = wispState.seed;

    renderer.render(scene, camera);
  };

  animate();
});

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId);
  window.removeEventListener('resize', () => {});
  renderer.dispose();
  material.dispose();
});
</script>

<template>
  <canvas ref="canvasRef" class="wisp-canvas"></canvas>
</template>

<style scoped>
.wisp-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 45; /* Below Nav ledge (50) but above page content */
}
</style>
