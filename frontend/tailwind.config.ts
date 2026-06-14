import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Design System: Ultramarine Editorial ───────────────────────────
        // Primary
        'primary':                  '#0040a1',
        'primary-container':        '#0056d2',
        'on-primary':               '#ffffff',
        'on-primary-container':     '#ccd8ff',
        'on-primary-fixed':         '#001847',
        'on-primary-fixed-variant': '#0040a1',
        'primary-fixed':            '#dae2ff',
        'primary-fixed-dim':        '#b2c5ff',
        'inverse-primary':          '#b2c5ff',
        'surface-tint':             '#0056d2',

        // Secondary
        'secondary':                '#5d5e61',
        'secondary-container':      '#e2e2e5',
        'on-secondary':             '#ffffff',
        'on-secondary-container':   '#636467',
        'secondary-fixed':          '#e2e2e5',
        'secondary-fixed-dim':      '#c6c6c9',
        'on-secondary-fixed':       '#1a1c1e',
        'on-secondary-fixed-variant':'#454749',

        // Tertiary
        'tertiary':                 '#822800',
        'tertiary-container':       '#a93802',
        'on-tertiary':              '#ffffff',
        'on-tertiary-container':    '#ffcebd',
        'tertiary-fixed':           '#ffdbcf',
        'tertiary-fixed-dim':       '#ffb59b',
        'on-tertiary-fixed':        '#380d00',
        'on-tertiary-fixed-variant':'#812800',

        // Error
        'error':                    '#ba1a1a',
        'error-container':          '#ffdad6',
        'on-error':                 '#ffffff',
        'on-error-container':       '#93000a',

        // Surface
        'surface':                  '#f9f9fc',
        'surface-dim':              '#dadadc',
        'surface-bright':           '#f9f9fc',
        'surface-variant':          '#e2e2e5',
        'surface-container-lowest': '#ffffff',
        'surface-container-low':    '#f3f3f6',
        'surface-container':        '#eeeef0',
        'surface-container-high':   '#e8e8ea',
        'surface-container-highest':'#e2e2e5',
        'inverse-surface':          '#2f3133',
        'inverse-on-surface':       '#f1f0f3',

        // Neutral
        'background':               '#f9f9fc',
        'on-background':            '#1a1c1e',
        'on-surface':               '#1a1c1e',
        'on-surface-variant':       '#424654',
        'outline':                  '#737785',
        'outline-variant':          '#c3c6d6',
      },
      fontFamily: {
        'headline': ['Plus Jakarta Sans', 'sans-serif'],
        'body':     ['Inter', 'sans-serif'],
        'label':    ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg':   ['3.5rem',  { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-md':   ['2.5rem',  { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm':   ['1.75rem', { lineHeight: '1.2',  letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-lg':  ['1.5rem',  { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md':  ['1.25rem', { lineHeight: '1.3',  letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm':  ['1.1rem',  { lineHeight: '1.4',  fontWeight: '600' }],
        'body-lg':      ['1rem',    { lineHeight: '1.6' }],
        'body-md':      ['0.875rem',{ lineHeight: '1.6' }],
        'label-lg':     ['0.875rem',{ lineHeight: '1.4',  letterSpacing: '0.05em', fontWeight: '600' }],
        'label-md':     ['0.75rem', { lineHeight: '1.4',  letterSpacing: '0.05em', fontWeight: '600' }],
      },
      borderRadius: {
        'DEFAULT': '0.375rem',
        'sm':      '0.25rem',
        'md':      '0.375rem',
        'lg':      '0.5rem',
        'xl':      '0.75rem',
        '2xl':     '1rem',
        'full':    '9999px',
      },
      boxShadow: {
        'editorial':  '0 24px 48px -12px rgba(0, 24, 71, 0.08)',
        'elevated':   '0 8px 24px -6px rgba(0, 24, 71, 0.12)',
        'subtle':     '0 2px 8px -2px rgba(0, 24, 71, 0.06)',
        'float':      '0 32px 64px -16px rgba(0, 24, 71, 0.14)',
      },
      backgroundImage: {
        'editorial-gradient': 'linear-gradient(135deg, #0040a1 0%, #0056d2 100%)',
        'hero-gradient':      'linear-gradient(to right, #f9f9fc, rgba(249,249,252,0.9), transparent)',
        'card-shine':         'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)',
      },
      backdropBlur: {
        'glass': '20px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-out',
        'slide-up':     'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':     'scaleIn 0.2s ease-out',
        'pulse-soft':   'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { '0%': { opacity: '0' },                     '100%': { opacity: '1' } },
        slideUp:      { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInRight: { '0%': { transform: 'translateX(16px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        scaleIn:      { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        pulseSoft:    { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
    },
  },
  plugins: [],
}
export default config
