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
        bg: '#0a0a0a',
        surface: {
          DEFAULT: '#121212',
          2: '#181818',
          subtle: '#111111',
        },
        terminal: {
          dark: '#0d0d0d',
          title: '#1a1a1a',
        },
        line: {
          DEFAULT: 'rgba(255, 255, 255, 0.075)',
          2: 'rgba(255, 255, 255, 0.12)',
          3: 'rgba(255, 255, 255, 0.20)',
        },
        text: {
          DEFAULT: '#ededed',
          2: '#8f8f8f',
          3: '#7a7a7a',
          4: '#5a5a5a',
        },
        amber: {
          DEFAULT: '#d97757', // High-visibility road hazard amber matching the reference accent
          safety: '#ff9800',
        },
        road: {
          pothole: '#e63946',
          crack: '#f4a261',
          rutting: '#e76f51',
          good: '#2a9d8f',
        }
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SF Mono', 'Menlo', 'monospace'],
        keys: ['-apple-system', 'BlinkMacSystemFont', 'Helvetica Neue', 'Segoe UI Symbol', 'sans-serif'],
      },
      maxWidth: {
        wrap: '1200px',
        content: '1248px',
      },
      borderRadius: {
        DEFAULT: '16px',
        card: '16px',
        pill: '999px',
        window: '12px',
        badge: '6px',
      },
      boxShadow: {
        card: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 1px 2px rgba(0, 0, 0, 0.5), 0 12px 32px rgba(0, 0, 0, 0.35)',
        'card-hover': 'inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 1px 2px rgba(0, 0, 0, 0.5), 0 16px 40px rgba(0, 0, 0, 0.45)',
        'btn-light': 'inset 0 -1px 0 rgba(0, 0, 0, 0.18), 0 1px 2px rgba(0, 0, 0, 0.5), 0 8px 24px rgba(0, 0, 0, 0.25)',
        'btn-ghost': 'inset 0 0 0 1px rgba(255, 255, 255, 0.12)',
        'btn-ghost-hover': 'inset 0 0 0 1px rgba(255, 255, 255, 0.20)',
        bar: 'inset 0 1px 0 rgba(255, 255, 255, 0.055), 0 1px 2px rgba(0, 0, 0, 0.55), 0 8px 24px rgba(0, 0, 0, 0.55), 0 30px 80px -10px rgba(0, 0, 0, 0.75)',
        window: '0 0 0 1px rgba(255, 255, 255, 0.09), 0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 40px 100px -20px rgba(0, 0, 0, 0.8), 0 80px 160px -40px rgba(0, 0, 0, 0.6)',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'bar-sweep': {
          '0%': { left: '-45%', opacity: '1' },
          '100%': { left: '130%', opacity: '0.4' },
        },
        'radar-ping': {
          '0%': { opacity: '0.8', transform: 'scale(1)' },
          '60%, 100%': { opacity: '0', transform: 'scale(1.45)' },
        },
        'flow-bar': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'caret-blink': {
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'bar-sweep': 'bar-sweep 0.5s ease-out',
        'radar-ping': 'radar-ping 2.8s ease-out 1.6s infinite',
        'flow-bar': 'flow-bar 6.5s linear both',
        'caret-blink': 'caret-blink 1s steps(1) infinite',
      },
    },
  },
  plugins: [],
}

