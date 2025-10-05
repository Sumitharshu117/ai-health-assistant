/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

   theme: {
    extend: {
      boxShadow: {
        'soft': '0 4px 14px 0 rgba(0, 0, 0, 0.05)',
        'hard': '0 4px 20px 0 rgba(0, 0, 0, 0.1)'
      },
      transitionProperty: {
        'height': 'height',
        'width': 'width'
      }
    }
  },
  plugins: []
}

