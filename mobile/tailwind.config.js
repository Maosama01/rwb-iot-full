/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        rawbin: {
          bg: '#F5F0E8',
          primary: '#2D5016',
          accent: '#4A7C2F',
          light: '#E8F0E0',
          card: '#FDFAF5',
          error: '#C0392B',
        }
      },
      fontFamily: {
        nunito: ['Nunito_400Regular', 'sans-serif'],
        'nunito-bold': ['Nunito_700Bold', 'sans-serif'],
        'nunito-black': ['Nunito_900Black', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
