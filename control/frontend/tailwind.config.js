/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        swag: {
          black: '#000000',
          white: '#FFFFFF',
          green: '#39FF14',
          'green-muted': '#2ECC40',
          'green-dark': '#27AE36',
          'green-subtle': 'rgba(57, 255, 20, 0.08)',
          pink: '#FF1493',
          'pink-hover': '#E91280',
          teal: '#00CED1',
        },
        surface: {
          0: '#000000',
          1: '#0D0D0D',
          2: '#1A1A1A',
          3: '#2A2A2A',
          4: '#333333',
        },
        'swag-border': {
          subtle: '#1A1A1A',
          DEFAULT: '#2A2A2A',
          strong: '#333333',
          focus: '#39FF14',
        },
        'swag-text': {
          primary: '#FFFFFF',
          secondary: '#B0B0B0',
          tertiary: '#888888',
          quaternary: '#555555',
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', '"Arial Narrow"', 'sans-serif'],
        body: ['"Inter"', '"Helvetica Neue"', 'Helvetica', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        panel: '16px',
        card: '14px',
        btn: '9999px',
        input: '10px',
        img: '8px',
        tag: '9999px',
      },
      boxShadow: {
        'glow-green': '0 0 24px rgba(57, 255, 20, 0.3)',
        'glow-green-lg': '0 0 40px rgba(57, 255, 20, 0.4)',
        'glow-green-sm': '0 0 12px rgba(57, 255, 20, 0.2)',
        'glow-pink': '0 4px 20px rgba(255, 20, 147, 0.3)',
        'inner-green': 'inset 0 0 20px rgba(57, 255, 20, 0.1)',
        'card-hover': '0 0 20px rgba(57, 255, 20, 0.15)',
        'card-elevated': '0 8px 32px rgba(0, 0, 0, 0.4)',
        'modal': '0 24px 80px rgba(0, 0, 0, 0.6)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(57, 255, 20, 0.2)' },
          '50%': { boxShadow: '0 0 24px rgba(57, 255, 20, 0.5)' },
        },
        'toast-in': {
          '0%': { transform: 'translateX(120%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'toast-out': {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(120%)', opacity: '0' },
        },
        'overlay-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-in-scale': 'fade-in-scale 0.25s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.3s ease-out forwards',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'toast-in': 'toast-in 0.3s ease-out forwards',
        'toast-out': 'toast-out 0.3s ease-in forwards',
        'overlay-in': 'overlay-in 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}
