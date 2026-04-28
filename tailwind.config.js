/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#1D9E75',
        'primary-dark': '#085041',
        'primary-light': '#E1F5EE',
        surface: '#F8F9FA',
        border: 'rgba(0,0,0,0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
