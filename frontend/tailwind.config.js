/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: 'var(--color-bg-base)',
          surface: 'var(--color-bg-surface)',
          elevated: 'var(--color-bg-elevated)',
          hover: 'var(--color-bg-hover)',
          subtle: 'var(--color-bg-subtle)',
        },
        border: {
          subtle: 'var(--color-border-subtle)',
          medium: 'var(--color-border-medium)',
          focus: 'var(--color-border-focus)',
          DEFAULT: 'var(--color-border-subtle)',
        },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
        },
        accent: {
          primary: 'var(--color-accent-primary)',
          'primary-hover': 'var(--color-accent-primary-hover)',
          'primary-subtle': 'var(--color-accent-primary-subtle)',
          secondary: 'var(--color-accent-secondary)',
          'secondary-hover': 'var(--color-accent-secondary-hover)',
          'secondary-subtle': 'var(--color-accent-secondary-subtle)',
          DEFAULT: 'var(--color-accent-primary)',
        },
        trade: {
          profit: 'var(--color-trade-profit)',
          'profit-subtle': 'var(--color-trade-profit-subtle)',
          loss: 'var(--color-trade-loss)',
          'loss-subtle': 'var(--color-trade-loss-subtle)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          subtle: 'var(--color-warning-subtle)',
        },
        // Backwards compatibility tokens
        background: {
          DEFAULT: 'var(--color-bg-base)',
          card: 'var(--color-bg-surface)',
          panel: 'var(--color-bg-elevated)',
          hover: 'var(--color-bg-hover)',
        },
        foreground: {
          DEFAULT: 'var(--color-text-primary)',
          muted: 'var(--color-text-secondary)',
          subtle: 'var(--color-text-muted)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      boxShadow: {
        elevated: '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        dropdown: '0 10px 30px -4px rgba(0, 0, 0, 0.55)',
        glow: '0 0 15px -2px rgba(66, 221, 162, 0.35)',
      },
    },
  },
  plugins: [],
};
