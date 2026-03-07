import type { Meta, StoryObj } from '@storybook/vue3-vite';
import AccountTray from './AccountTray.vue';

/**
 * The **AccountTray** component is a mechanical accordion-style account panel
 * inspired by the Teenage Engineering TP-7's physical aesthetic.
 *
 * - Clicking the header **opens the tray upward**, revealing three SaaS usage
 *   stat panels via a serialised X-axis cascade flip animation.
 * - Each panel contains an **inset LCD odometer** whose digits roll into place
 *   using a staggered CSS `translateY` animation after the chip lands.
 * - An extruded **"Manage Usage" button** at the bottom provides a tactile
 *   press animation (`translateY` 4 px on `:active`).
 * - Closing the tray **snaps shut instantly** (80 ms), skipping the slow open
 *   sequence to create a satisfying mechanical feel.
 *
 * All motion uses hand-crafted cubic-bezier curves tuned to feel physical
 * rather than digital — no spring libraries required.
 */
const meta = {
    title: 'Portfolio / Account Tray / Tray',
    component: AccountTray,
    parameters: {
        layout: 'centered',
        docs: {
            description: {
                component:
                    'A TP-7-inspired mechanical account tray featuring a serialised X-axis chip-flip ' +
                    'cascade, CSS digit-rolling LCD odometers, and a snap-shut close animation.',
            },
        },
        backgrounds: {
            default: 'dark-green',
            values: [
                { name: 'dark-green', value: '#1a3328' },
                { name: 'light-grey', value: '#e5e5e5' },
            ],
        },
    },
} satisfies Meta<typeof AccountTray>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The tray in its **default closed state** — shows only the header handle.
 * Click the header to trigger the mechanical opening sequence.
 */
export const Closed: Story = {};

/**
 * The tray in its **open state**. The three stat chips have flipped into view,
 * the LCD odometers have rolled to their target values, and the "Manage Usage"
 * action button is extruded at the bottom of the cavity.
 */
export const Open: Story = {
    play: async ({ canvasElement }) => {
        // Programmatically open the tray so Storybook renders the open state.
        const header = canvasElement.querySelector<HTMLButtonElement>('.tray-header');
        header?.click();
    },
};
