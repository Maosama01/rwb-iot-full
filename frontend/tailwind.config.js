/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FBFBFA', // Soft off-white
        surface: '#FFFFFF', // Pure white for cards
        primary: {
          light: '#A5C9A5',
          DEFAULT: '#8FBC8F', // Sage green
          dark: '#689B68',
        },
        emerald: {
          light: '#4CB580',
          DEFAULT: '#2E8B57', // Leafy emerald
          dark: '#1E5E3A',
        },
        text: {
          primary: '#2F4F4F', // Deep charcoal
          secondary: '#556B6B',
          muted: '#8F9B9B',
        },
        alert: {
          bg: '#FDF3F1',
          DEFAULT: '#E27D60', // Terracotta warning
          dark: '#C86144',
        },
        border: 'rgba(47, 79, 79, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'organic-sm': '0 4px 20px rgba(47, 79, 79, 0.03)',
        'organic-md': '0 8px 30px rgba(47, 79, 79, 0.06)',
        'organic-lg': '0 12px 40px rgba(47, 79, 79, 0.09)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
