/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        'neon-red': '#EF4444',
        'orb-gray': '#6B7280',
        'brutalist-black': '#000000',
        'brutalist-white': '#FFFFFF',
      },
      fontSize: {
        'yell': '200px',
      },
      fontFamily: {
        'stack': ['"Stack Sans Notch"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
