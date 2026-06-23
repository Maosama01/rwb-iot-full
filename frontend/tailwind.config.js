/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: 'var(--cream-50)',
          100: 'var(--cream-100)',
        },
        linen: {
          0: 'var(--linen-0)',
        },
        compost: {
          500: 'var(--compost-500)',
          700: 'var(--compost-700)',
          900: 'var(--compost-900)',
        },
        leaf: {
          100: 'var(--leaf-100)',
          400: 'var(--leaf-400)',
          600: 'var(--leaf-600)',
          900: 'var(--leaf-900)',
        },
        terracotta: {
          500: 'var(--terracotta-500)',
        },
        border: 'var(--border-color)',
        // Keeping semantic names pointing to our new palette for backwards compatibility during refactor
        background: 'var(--cream-50)',
        surface: 'var(--cream-100)',
        text: {
          primary: 'var(--compost-900)',
          secondary: 'var(--compost-700)',
          muted: 'var(--compost-500)',
        },
        alert: {
          bg: '#FFF5F3',
          DEFAULT: 'var(--terracotta-500)',
          dark: '#B94B34',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Outfit', 'Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        'organic-sm': '0 4px 20px rgba(139, 115, 85, 0.05)',
        'organic-md': '0 8px 30px rgba(139, 115, 85, 0.08)',
        'organic-lg': '0 12px 40px rgba(139, 115, 85, 0.12)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        'full': '9999px',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'spring-bouncy': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'slide-up-spring': 'slideUpSpring 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        slideUpSpring: {
          '0%': { transform: 'translateY(100%)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}
