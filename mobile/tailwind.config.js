/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        rawbin: {
          bg: '#fff9e7',       // Off-white
          primary: '#45B900',  // Rawbin Green
          accent: '#e6b8ff',   // Lavender Fields
          text: '#251605',     // Chestnut Brown
          subtext: '#744107',  // Milk Chocolate
          tan: '#e5a971',      // Coconut Cream
          card: '#ffffff',
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
