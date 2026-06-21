/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-main)',
        surface: 'var(--bg-surface)',
        primary: {
          light: 'var(--color-primary-light)',
          DEFAULT: 'var(--color-primary)',
          dark: 'var(--color-primary-dark)',
        },
        emerald: {
          light: 'var(--color-emerald-light)',
          DEFAULT: 'var(--color-emerald)',
          dark: 'var(--color-emerald-dark)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        alert: {
          bg: 'var(--alert-bg)',
          DEFAULT: 'var(--alert-main)',
          dark: 'var(--alert-dark)',
        },
        border: 'var(--border-color)',
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
