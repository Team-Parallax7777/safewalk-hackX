/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // --- Brand & Primary ---
        amber:    { DEFAULT: '#E8994A', light: '#F0B070', dark: '#C47830' },
        void:     { DEFAULT: '#110F0C', light: '#1C1916' },
        cinder:   '#1C1916',
        ash:      '#2A2520',
        smoke:    '#3B2F25',
        // Amber tint for glow effects
        'amber-tint': '#3B2510',

        // --- Semantic / Status ---
        safe:     '#4A9E6B',
        warn:     '#D4853A',
        sos:      '#C44B38',
        guardian: '#5B8FA8',

        // --- Text ---
        cream:    '#F5EDD8',
        muted:    '#8A7D70',
        faint:    '#4A403A',
      },
      fontFamily: {
        display: ['var(--font-bricolage)', 'serif'],
        body:    ['var(--font-outfit)', 'sans-serif'],
        mono:    ['var(--font-ibm-plex)', 'monospace'],
      },
      keyframes: {
        'pulse-ring': {
          '0%':   { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'sos-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(196, 75, 56, 0.7)' },
          '50%':      { boxShadow: '0 0 0 16px rgba(196, 75, 56, 0)' },
        },
        'safe-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(74, 158, 107, 0.7)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(74, 158, 107, 0)' },
        },
        'amber-glow': {
          '0%, 100%': { boxShadow: '0 0 12px rgba(232, 153, 74, 0.3)' },
          '50%':      { boxShadow: '0 0 28px rgba(232, 153, 74, 0.6)' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'guardian-arrive': {
          '0%':   { transform: 'scale(1)',    opacity: '0.6' },
          '50%':  { transform: 'scale(1.15)', opacity: '1'   },
          '100%': { transform: 'scale(1)',    opacity: '0.6' },
        },
      },
      animation: {
        'pulse-ring':     'pulse-ring 1.8s cubic-bezier(0.215, 0.61, 0.355, 1) infinite',
        'sos-pulse':      'sos-pulse 1.4s ease-in-out infinite',
        'safe-pulse':     'safe-pulse 2s ease-in-out infinite',
        'amber-glow':     'amber-glow 3s ease-in-out infinite',
        'slide-up':       'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in':        'fade-in 0.5s ease forwards',
        'guardian-arrive':'guardian-arrive 2s ease-in-out infinite',
      },
      backgroundImage: {
        'amber-gradient': 'linear-gradient(135deg, #E8994A 0%, #C47830 100%)',
        'sos-gradient':   'linear-gradient(135deg, #C44B38 0%, #8B2A1A 100%)',
        'void-gradient':  'linear-gradient(180deg, #110F0C 0%, #1C1916 100%)',
      },
    },
  },
  plugins: [],
}
