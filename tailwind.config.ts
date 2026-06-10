import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#1e3a8a', // MyEduRide Royal Blue
          600: '#1e40af', // Deep Royal Blue
          700: '#2563eb', // Vibrant Blue
          800: '#1e3a8a',
          900: '#172554',
          950: '#0f172a', // Midnight / Space Black Navy
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d', // Safety Gold Yellow
          400: '#fbbf24', // Vibrant Yellow-Gold
          500: '#f59e0b', // Safety Amber / Gold
          600: '#d97706', // Deep Alert Amber
          700: '#b45309',
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
