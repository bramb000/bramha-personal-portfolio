<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

type ChatState = 'idle' | 'listening' | 'processing' | 'speaking'

const currentState = ref<ChatState>('idle')
const canvasRef = ref<HTMLCanvasElement | null>(null)
let animationFrameId: number

// Mock the SpeechSynthesis API for the voice reply
const speechLine = "I am a simulated voice reply. There is no logic here."

const handleAction = () => {
  if (currentState.value === 'idle') {
    currentState.value = 'listening'
    // Simulate listening for 3 seconds
    setTimeout(() => {
      currentState.value = 'processing'
      // Simulate processing for 2 seconds
      setTimeout(() => {
        currentState.value = 'speaking'
        speakLine()
      }, 2000)
    }, 3000)
  } else if (currentState.value === 'speaking') {
    // allow interrupt
    window.speechSynthesis.cancel()
    currentState.value = 'idle'
  }
}

const speakLine = () => {
  const synth = window.speechSynthesis
  if (!synth) {
    // Fallback if not supported
    setTimeout(() => {
      currentState.value = 'idle'
    }, 4000)
    return
  }
  
  const utterance = new SpeechSynthesisUtterance(speechLine)
  
  // try to find a nice English voice
  const voices = synth.getVoices()
  
  // First, filter to ensure it's an English voice (prevents random French/foreign accents)
  const englishVoices = voices.filter(v => v.lang.startsWith('en-'))
  
  // Then prefer Google, Siri, or 'Female' labeled voices if available
  const preferredVoice = englishVoices.find(v => 
    v.name.includes('Google') || 
    v.name.includes('Siri') || 
    v.name.includes('Female')
  ) || englishVoices[0] // Fallback to the first available English voice

  if (preferredVoice) utterance.voice = preferredVoice
  
  utterance.onend = () => {
    currentState.value = 'idle'
  }
  
  synth.speak(utterance)
}

// Particle System for "Ethereal Braille Marks"
class Particle {
  x: number
  y: number
  baseX: number
  baseY: number
  size: number
  angle: number
  speed: number
  offset: number
  distance: number
  color: string
  targetX: number
  targetY: number

  constructor(width: number, height: number) {
    this.x = Math.random() * width
    this.y = Math.random() * height
    this.baseX = this.x
    this.baseY = this.y
    this.targetX = this.x
    this.targetY = this.y
    this.size = Math.random() * 2 + 1 // "braille marks"
    this.angle = Math.random() * Math.PI * 2
    this.speed = Math.random() * 0.02 + 0.005
    this.offset = Math.random() * 100
    this.distance = Math.random() * 50 + 20
    this.color = 'rgba(255, 255, 255, 0.8)' // Will be overridden in render based on mode
  }

  update(state: ChatState, time: number, cx: number, cy: number, audioLevel: number) {
    // In all states, the particles are "alive" with some base noise/wandering
    const wanderX = Math.sin(time * 0.001 + this.offset) * 10
    const wanderY = Math.cos(time * 0.001 + this.offset) * 10
    
    // Determine target shape based on state
    if (state === 'idle') {
      // Dispersed wavelike pattern
      this.targetX = this.baseX + Math.sin(time * 0.0005 + this.baseY * 0.01) * 30
      this.targetY = this.baseY + Math.cos(time * 0.0005 + this.baseX * 0.01) * 30
      
    } else if (state === 'listening') {
      // Pull together to form a listening ring, reacting to simulated mic input (audioLevel)
      const radius = 80 + audioLevel * 20 + Math.sin(time*0.005 + this.offset)*5
      this.targetX = cx + Math.cos(this.angle) * radius
      this.targetY = cy + Math.sin(this.angle) * radius
      this.angle += this.speed * 2
      
    } else if (state === 'processing') {
      // Swirling infinity symbol / vortex
      const t = time * 0.001 + this.offset * 0.1
      const scale = 60
      // Lemniscate of Bernoulli
      this.targetX = cx + (scale * Math.cos(t)) / (1 + Math.sin(t) * Math.sin(t)) * 1.5
      this.targetY = cy + (scale * Math.sin(t) * Math.cos(t)) / (1 + Math.sin(t) * Math.sin(t)) * 1.5
      
    } else if (state === 'speaking') {
      // Soundwaves / horizontal bands
      const bandY = cy + (Math.sin(this.angle) * 60)
      const waveAmplitude = audioLevel * 30 + 10
      this.targetX = cx + (this.baseX - cx) * 0.5 + Math.sin(time * 0.005 + bandY * 0.05) * waveAmplitude
      this.targetY = bandY
      this.angle += this.speed
    }

    // Add the wander noise to the target
    const finalTargetX = this.targetX + wanderX
    const finalTargetY = this.targetY + wanderY

    // Fluid ease towards target
    this.x += (finalTargetX - this.x) * 0.05
    this.y += (finalTargetY - this.y) * 0.05
  }

  draw(ctx: CanvasRenderingContext2D, isDark: boolean, audioLevel: number, state: ChatState) {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size + (audioLevel * 0.1), 0, Math.PI * 2)
    
    // Choose color based on state and theme
    let r, g, b, a;
    if (state === 'listening' || state === 'speaking') {
       // Cyan/Accent glow
       r = 0; g = 240; b = 255; a = 0.8 + audioLevel * 0.2;
    } else if (state === 'processing') {
       // Purple/Pink processing glow
       r = 180; g = 100; b = 255; a = 0.8;
    } else {
       // Idle color
       if (isDark) {
           r = 160; g = 170; b = 180; a = 0.5;
       } else {
           r = 100; g = 110; b = 120; a = 0.4;
       }
    }
    
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
    // Add a skeumorphic shadow to each dot to make them feel extruded
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.8)' : 'rgba(166, 171, 189, 0.8)'
    ctx.shadowBlur = 2
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.fill()
    ctx.closePath()
    
    // Reset shadow so it doesn't build up
    ctx.shadowColor = 'transparent'
  }
}

let particles: Particle[] = []

const initParticles = (width: number, height: number) => {
  particles = []
  const count = window.innerWidth < 768 ? 100 : 250 // fewer on mobile
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(width, height))
  }
}

const renderCanvas = (time: number) => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const isDark = document.documentElement.classList.contains('dark')
  
  // Clear with transparent so the CSS background shows through
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const cx = canvas.width / 2
  const cy = canvas.height / 2
  
  // Create a simulated audio level that bounces
  let audioLevel = 0
  if (currentState.value === 'listening' || currentState.value === 'speaking') {
      // smooth random noise for audio level
      audioLevel = (Math.sin(time * 0.01) * 0.5 + 0.5) * (Math.random() * 0.5 + 0.5) * 20
  }

  particles.forEach(p => {
    p.update(currentState.value, time, cx, cy, audioLevel)
    p.draw(ctx, isDark, audioLevel, currentState.value)
  })

  animationFrameId = requestAnimationFrame(renderCanvas)
}

const resizeCanvas = () => {
    if(!canvasRef.value) return
    const container = canvasRef.value.parentElement
    if(container) {
        canvasRef.value.width = container.clientWidth
        canvasRef.value.height = container.clientHeight
        initParticles(canvasRef.value.width, canvasRef.value.height)
    }
}

onMounted(() => {
  window.addEventListener('resize', resizeCanvas)
  resizeCanvas() // Initial size setup
  animationFrameId = requestAnimationFrame(renderCanvas)
  
  // prime voices
  if(window.speechSynthesis) {
     window.speechSynthesis.getVoices()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  cancelAnimationFrame(animationFrameId)
  if(window.speechSynthesis) window.speechSynthesis.cancel()
})
</script>

<template>
  <div class="voice-component-inner flex flex-col items-center justify-center p-6 w-full h-full">
    
    <!-- The Neumorphic Central Container -->
    <div 
      class="neumorphic-orb relative rounded-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)]"
      :class="[
        currentState !== 'idle' ? 'active-inset scale-95' : 'idle-outset scale-100',
        'w-64 h-64 md:w-80 md:h-80'
      ]"
      @click="handleAction"
      role="button"
      :aria-label="currentState === 'idle' ? 'Start listening' : 'Stop interaction'"
    >
      <!-- Canvas for the floating braille marks -->
      <canvas 
        ref="canvasRef" 
        class="absolute inset-x-0 inset-y-0 w-full h-full rounded-full z-10 pointer-events-none"
      ></canvas>

      <!-- Inner glow for active states -->
      <div 
        class="absolute inset-x-0 inset-y-0 rounded-full transition-opacity duration-1000 mix-blend-screen"
        :class="{
            'opacity-0': currentState === 'idle',
            'opacity-40 bg-cyan-400/20 blur-xl': currentState === 'listening',
            'opacity-50 bg-fuchsia-400/20 blur-xl': currentState === 'processing',
            'opacity-60 bg-cyan-300/30 blur-2xl': currentState === 'speaking'
        }"
      ></div>
    </div>
    
    <!-- Status Text -->
    <div class="mt-12 h-8">
        <p class="font-sans text-sm tracking-widest uppercase font-bold transition-opacity duration-300"
           :class="currentState === 'idle' ? 'opacity-40' : 'opacity-100 text-cyan-600 dark:text-cyan-400'">
            {{ currentState }}
        </p>
    </div>

  </div>
</template>

<style scoped>
.voice-component-inner {
    /* Ensure the component blends into the parent's neumorphic background */
    background: transparent;
}

.neumorphic-orb {
    /* Inherit the neumorphic background color from the root variables we defined in the wrapper */
    background-color: var(--neo-bg);
    cursor: pointer;
    /* Prevent highlight on mobile tap */
    -webkit-tap-highlight-color: transparent;
}

/* OUTSET SHADOW (Idle) */
.idle-outset {
    box-shadow: 
        -12px -12px 24px var(--neo-shadow-light),
        12px 12px 24px var(--neo-shadow-dark);
}

.idle-outset:hover {
    box-shadow: 
        -16px -16px 32px var(--neo-shadow-light),
        16px 16px 32px var(--neo-shadow-dark);
}

/* INSET SHADOW (Active/Listening/Processing/Speaking) */
.active-inset {
    box-shadow: 
        inset -8px -8px 16px var(--neo-shadow-light),
        inset 8px 8px 16px var(--neo-shadow-dark);
}
</style>
