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
        'glow-pink': '0 4px 20px rgba(255, 20, 147, 0.3)',
        'card-hover': '0 0 20px rgba(57, 255, 20, 0.15)',
      },
    },
  },
  plugins: [],
}
