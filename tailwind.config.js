/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        op: {
          red: '#b91c1c',
          'red-dark': '#450a0a',
          gold: '#d4af37',
          'gold-dim': '#856d1e',
          bg: '#09090b',
          panel: '#18181b',
          border: '#27272a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        typewriter: ['"Special Elite"', 'cursive'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      }
    },
  },
  plugins: [],
}