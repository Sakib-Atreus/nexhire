import type { Config } from 'tailwindcss';

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

// Colored families whose light tints get dark-mode variants (see globals.css).
const TINT_FAMILIES = ['primary', 'rose', 'amber', 'emerald', 'sky', 'indigo', 'violet', 'teal', 'fuchsia'];
const tint = (prefix: string, shades: number[]) =>
  Object.fromEntries(TINT_FAMILIES.map((f) => [f, Object.fromEntries(shades.map((s) => [s, v(`${prefix}-${f}-${s}`)]))]));

const config: Config = {
  // `dark` class on <html>, set before paint by the script in app/layout.tsx.
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Badge/status colour classes live in lib/constants.ts; without this they never reach the CSS.
    './src/lib/**/*.{js,ts,jsx,tsx}',
    './src/hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: v('surface'),
        canvas: v('canvas'),
        muted: v('muted'),
        subtle: v('subtle'),
        emphasis: v('emphasis'),
        fg: {
          DEFAULT: v('fg'),
          soft: v('fg-soft'),
          secondary: v('fg-secondary'),
          tertiary: v('fg-tertiary'),
          muted: v('fg-muted'),
          subtle: v('fg-subtle'),
          faint: v('fg-faint'),
        },
        line: {
          DEFAULT: v('line'),
          subtle: v('line-subtle'),
          strong: v('line-strong'),
        },
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
      },
      // Per-property overrides so only tints flip in dark mode; solid shades (e.g. bg-emerald-600 buttons) don't.
      backgroundColor: tint('bg', [50, 100, 200]),
      textColor: tint('tx', [600, 700, 800, 900]),
      borderColor: tint('bd', [100, 200, 300]),
      ringColor: tint('bd', [100, 200, 300]),
      gradientColorStops: tint('bg', [50, 100, 200]),
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
      },
      keyframes: {
        'toast-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        // Slow drift for the dark-mode hero glows.
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(-4%, 6%, 0) scale(1.08)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.2s ease-out',
        drift: 'drift 16s ease-in-out infinite',
        'drift-slow': 'drift 24s ease-in-out infinite reverse',
      },
    },
  },
  plugins: [],
};

export default config;
