/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom navy palette matching CSS variables
        navy: {
          950: '#060A18',
          900: '#0C1228',
          800: '#10182E',
          700: '#14203A',
          600: '#1A2B4A',
        },
        brand: {
          blue: '#5B9FFF',
          'blue-light': '#87C0FF',
          gold: '#F5B942',
          'gold-light': '#FFD580',
          purple: '#8B65F5',
          green: '#22C87A',
          red: '#FF5F6B',
          cyan: '#22D3EE',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xl2': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
      },
    },
  },
  plugins: [],
}
