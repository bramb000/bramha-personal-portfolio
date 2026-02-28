import type { Meta, StoryObj } from '@storybook/vue3-vite';
import VoiceChatComponent from './VoiceChatComponent.vue';

/**
 * The **VoiceChatComponent** is a premium, Neumorphic voice assistant UI featuring 
 * fluid "ethereal braille marks" rendered on an HTML `<canvas>`.
 * 
 * ### Animation Engine
 * The animation pipeline works entirely on a Canvas 2D context using an independent 
 * particle physics engine:
 * 
 * - **Ambient Hover:** In the `idle` state, up to 800 individual glowing coordinate 
 *   point particles (or "stars") randomly orbit anchor points. They implement a weak-gravity 
 *   mouse event listener so they smoothly attract towards your pointer on hover without 
 *   collapsing their formation.
 * - **Dynamic Shapes:** When an action state is triggered, the engine parses raw 
 *   SVG path `d` strings (e.g., standard Lucide icons). It splits shapes by the `M` 
 *   command, maps a geometric boundary, and calculates relative total path lengths to 
 *   ensure visually unbroken density. Finally, it uses `getPointAtLength` to evenly distribute 
 *   particles along the exact pixel curvature of the shape.
 * - **Crisp Resolutions:** By dynamically adjusting the "wander noise" based on the state 
 *   (i.e., using a 10px wander radius for ambient floating, but a micro 1.5px blur for 
 *   strict shapes like a car or a chef\'s hat), the visual silhouette remains crystal clear.
 * - **Audio Reactivity:** During the `listening` and `speaking` states, the background 
 *   blend mode expands with an animated glowing gradient while the physical size and opacity 
 *   of each particle pulses to simulated audio frequencies using math sine waves.
 * 
 * ### Device Fallbacks
 * - It monitors window width to display device-specific string literals like 
 *   "Click to awaken me" (Desktop) vs "Tap to awaken me" (Mobile).
 * - A 6-second inactivity timeout triggers an `idle_hint` state where the stars morph 
 *   into a generic index finger and physically press "down" (scaling on the Z-axis) to 
 *   teach users they can touch the orb.
 * - Users without a microphone can click "Use text instead" to gracefully reveal a 
 *   Vue-transitioned Neumorphic fallback input field.
 */
const meta = {
    title: 'Micro-projects / AI Voice Chat / Orb',
    component: VoiceChatComponent,
    argTypes: {
        theme: {
            control: 'inline-radio',
            options: ['dark', 'light'],
            description: 'Forces the container environment to a light or dark Neumorphic style. Note that glowing canvas particles look significantly better on Dark.',
            table: {
                type: { summary: "'dark' | 'light'" },
                defaultValue: { summary: 'dark' },
            },
        },
    },
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'A rich, Skeumorphic conversational orb featuring fluid animated ' +
                    'particle states and Web Speech Recognition API integration.',
            },
        },
    },
    decorators: [
        (story, context) => ({
            components: { story },
            setup() {
                const theme = context.args.theme || 'dark';
                return { theme };
            },
            template: `
                <div 
                    class="w-full flex items-center justify-center min-h-[600px] relative p-8 transition-colors duration-500"
                    :style="theme === 'dark' 
                        ? '--neo-bg: #1e2024; --neo-text: #E6E9EF; --neo-shadow-light: #2a2d33; --neo-shadow-dark: #121417; background-color: var(--neo-bg); color: var(--neo-text);' 
                        : '--neo-bg: #E6E9EF; --neo-text: #2A2A2A; --neo-shadow-light: #ffffff; --neo-shadow-dark: rgba(166, 171, 189, 0.6); background-color: var(--neo-bg); color: var(--neo-text);'"
                >
                    <story />
                </div>
            `,
        }),
    ],
} satisfies Meta<any>;

export default meta;
type Story = StoryObj<any>;

/**
 * The premium **Dark** layout, featuring sleek charcoal surfaces that allow the 
 * "mix-blend-screen" glowing neon stars to aggressively contrast. Look near the center 
 * to see the Neumorphic indent/outset shadows transition.
 */
export const DarkTheme: Story = {
    args: {
        theme: 'dark'
    }
};

/**
 * The **Light** layout. Though less striking than the dark scheme for glowing particles, 
 * the bright background emphasizes the subtle, physical Skeumorphic dropshadow depth 
 * embedded into the UI buttons and input fields fallback.
 */
export const LightTheme: Story = {
    args: {
        theme: 'light'
    }
};
