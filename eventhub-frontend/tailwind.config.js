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
        canvas: '#020617',
        surface: {
          DEFAULT: '#0f172a',
          lighter: '#1e293b',
          border: '#334155',
        },
        brand: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5',
          dark: '#3730a3',
          glow: 'rgba(99, 102, 241, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.35)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.35)',
        'glow-rose': '0 0 25px -5px rgba(244, 63, 94, 0.35)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-rose': 'flashRose 1s ease-in-out infinite',
      },
      keyframes: {
        flashRose: {
          '0%, 100%': { backgroundColor: 'rgba(244, 63, 94, 0.2)', borderColor: '#f43f5e' },
          '50%': { backgroundColor: 'transparent', borderColor: 'transparent' },
        },
      },
    },
  },
  plugins: [],
}
