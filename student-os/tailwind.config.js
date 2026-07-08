/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#050816',
          raised: '#0A1024',
          card: '#0D1428',
          hair: 'rgba(255,255,255,0.08)',
        },
        primary: {
          DEFAULT: '#2563EB',
          light: '#60A5FA',
          dark: '#1D4ED8',
        },
        accent: {
          violet: '#7C5CFC',
          cyan: '#22D3EE',
        },
        ink: {
          DEFAULT: '#E7EAF3',
          muted: '#9AA3B8',
          faint: '#5C6478',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(37,99,235,0.25), 0 0 40px -10px rgba(37,99,235,0.5)',
        'glow-lg': '0 0 0 1px rgba(37,99,235,0.2), 0 20px 60px -20px rgba(37,99,235,0.45)',
        card: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 30px -12px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to bottom, rgba(5,8,22,0) 0%, #050816 90%), linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        'radial-glow':
          'radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(37,99,235,0.15), transparent 40%)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(1deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
}
