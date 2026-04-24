/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{vue,js,ts,jsx,tsx}",
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg-primary': '#0a0e17',
        'brand-bg-secondary': '#111827',
        'brand-bg-tertiary': '#1f2937',
        'brand-border': '#374151',
        'brand-green': '#10b981',
        'brand-red': '#ef4444',
        'brand-yellow': '#f59e0b',
        'brand-blue': '#3b82f6',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['IBM Plex Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
