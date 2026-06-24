/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        oranje:  '#F27A00',
        bruin:   '#2B1400',
        donker:  '#111111',
        kaart:   '#181818',
      },
      fontFamily: {
        sans: ['var(--font-work-sans)', 'sans-serif'],
        display: ['var(--font-big-shoulders)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
