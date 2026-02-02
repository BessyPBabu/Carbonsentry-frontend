/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f5f1',
          100: '#b3e0d6',
          200: '#80cbb9',
          300: '#4db69d',
          400: '#26a687',
          500: '#1a8f70', 
          600: '#167a5f',
          700: '#12654e',
          800: '#0e503d',
          900: '#0a3b2c',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        accent: {
          yellow: '#FFA500',
          red: '#EF4444',
          green: '#10B981',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to bottom right, #1a8f70, #12654e)',
      }
    },
  },
  plugins: [],
}
