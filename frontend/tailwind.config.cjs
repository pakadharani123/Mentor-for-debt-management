/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B0F19',
          slate: '#1E293B',
          primary: '#10B981',
          secondary: '#6366F1',
          muted: '#94A3B8',
          card: '#111827'
        },
        risk: {
          critical: '#EF4444',
          high: '#F97316',
          recovering: '#3B82F6',
          stable: '#06B6D4',
          excellent: '#10B981'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 15px rgba(16, 185, 129, 0.15)',
        'glow-secondary': '0 0 15px rgba(99, 102, 241, 0.15)'
      }
    },
  },
  plugins: [],
}
