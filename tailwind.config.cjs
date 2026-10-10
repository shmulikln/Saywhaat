module.exports = {
  content: [
    "./index.html",
    "./App.tsx",
    "./index.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        'luckiest-guy': ['Luckiest Guy', 'cursive'],
        'secular-one': ['Secular One', 'sans-serif'],
      },
      animation: {
        glitch: 'glitch 0.2s infinite',
        'slot-spin': 'slot-spin 0.1s infinite',
        'hard-cut': 'hardCut 0.05s ease-in',
        'word-snap': 'wordSnap 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'gentle-pulse': 'gentlePulse 2s ease-in-out infinite',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { transform: 'translate(0)' },
          '33%': { transform: 'translate(-2px, 2px)' },
          '66%': { transform: 'translate(2px, -2px)' },
        },
        'slot-spin': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-10px)' },
        },
        hardCut: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        wordSnap: {
          '0%': { transform: 'translateY(40px) scale(0.7)', opacity: '0', filter: 'blur(10px)' },
          '70%': { transform: 'translateY(-5px) scale(1.05)', opacity: '1', filter: 'blur(0px)' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1', filter: 'blur(0px)' },
        },
        gentlePulse: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 10px 30px rgba(251,191,36,0.3)' },
          '50%': { transform: 'scale(1.025)', boxShadow: '0 14px 35px rgba(251,191,36,0.55), 0 0 16px rgba(251,191,36,0.35)' },
        },
      }
    }
  },
  plugins: []
};
