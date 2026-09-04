import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          50: '#F5F3FF',
          100: '#EEE6FF',
          200: '#DBC8FF',
        },
        accent: '#C2410C',
      },
      borderRadius: {
        lg: '0.75rem',
      },
    },
  },
  plugins: [],
}

export default config
