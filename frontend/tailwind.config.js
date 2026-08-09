/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F172A',
          50: '#F1F4F9',
          100: '#E2E8F2',
          400: '#3D4C6B',
          700: '#151E33',
          800: '#0F172A',
          900: '#0A0F1D',
        },
        blue: {
          DEFAULT: '#2563EB',
          50: '#EFF4FE',
          100: '#DBE7FD',
        },
        green: {
          DEFAULT: '#22C55E',
          50: '#EAFBF1',
          100: '#D3F7E3',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(2deg)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        spinSlow: {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
        drift: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(40px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.6 },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        floatSlow: 'floatSlow 8s ease-in-out infinite',
        blob: 'blob 12s infinite ease-in-out',
        spinSlow: 'spinSlow 14s linear infinite',
        drift: 'drift 6s ease-in-out infinite alternate',
        pulseSoft: 'pulseSoft 3s ease-in-out infinite',
      },
      boxShadow: {
        glow: '0 0 40px rgba(37, 99, 235, 0.25)',
        card: '0 10px 40px -12px rgba(15, 23, 42, 0.15)',
      },
    },
  },
  plugins: [],
}
