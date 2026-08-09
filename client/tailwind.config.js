/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'slide-in-right': {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        'slide-out-right': {
          '0%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
          '100%': {
            transform: 'translateX(100%)',
            opacity: '0',
          },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.35s cubic-bezier(0.25, 1, 0.5, 1) forwards',
        'slide-out-right': 'slide-out-right 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards',
      },
    },
  },
  plugins: [],
}