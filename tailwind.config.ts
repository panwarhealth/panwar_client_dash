import type { Config } from 'tailwindcss';

/**
 * Two layers of theming:
 *
 * 1. Panwar Health brand colours (`ph-*`) — fixed across the app, used for
 *    structural / chrome elements (login page, error states, etc.)
 *
 * 2. Per-client colours (`client-*`) — read from CSS variables that the
 *    auth bootstrap sets based on the logged-in client's record. The same
 *    React components paint themselves with whichever client's branding
 *    is active. Default values fall back to PH purple so the app still
 *    looks correct before /me has loaded.
 *
 * Brand reference: panwarhealth.com.au tailwind.config.mjs uses #702f8f
 * (the brief listed #6F2C90 — same colour, different hex spelling).
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Panwar Health brand palette
        'ph-purple': '#702f8f',
        'ph-pink': '#B41E8C',
        'ph-coral': '#FF8C50',
        'ph-sky': '#38C6F4',
        'ph-charcoal': '#454646',
        'ph-grey': '#454242',

        // Per-client palette (CSS variables, swappable at runtime)
        'client-primary': 'rgb(var(--client-primary) / <alpha-value>)',
        'client-accent': 'rgb(var(--client-accent) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['"museo-sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
