/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        discord: '#5865F2',
        surface: { DEFAULT: '#1e1f22', light: '#2b2d31', dark: '#111214' },
      },
    },
  },
  plugins: [],
};
