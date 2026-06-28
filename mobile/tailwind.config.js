/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        'text-primary': '#000000',
        'text-secondary': '#666666',
        primary: '#4ade80',
        card: '#f8fafc',
      }
    },
  },
  plugins: [],
}
