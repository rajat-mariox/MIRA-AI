/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#45CAFF',
          pink: '#FF1B6B',
          indigo: '#464670',
          magenta: '#852054',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#45CAFF', // Updated to match brand cyan
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          pink: '#FF1B6B', // Updated to match brand pink
          purple: '#8b5cf6',
          indigo: '#6366f1',
        },
        dark: {
          bg: '#0a0a0c',
          card: '#16161e',
          border: '#23232e',
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #45CAFF 0%, #FF1B6B 100%)',
        'theme-gradient': 'linear-gradient(to bottom, #464670 0%, #852054 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
