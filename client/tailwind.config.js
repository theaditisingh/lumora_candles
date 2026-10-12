/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { oat: '#ECE6DC', paper: '#FAF8F4', smoke: '#26211F', fig: { DEFAULT: '#5B3A4A', dark: '#442B38' }, wax: '#C8963E', sand: '#D9D0C1', stone: '#6E645D' },
      fontFamily: { display: ['Fraunces', 'Georgia', 'serif'], sans: ['Figtree', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
