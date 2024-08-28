import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.5rem' }],
      base: ['1rem', { lineHeight: '2rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '2rem' }],
      '2xl': ['1.5rem', { lineHeight: '2.5rem' }],
      '3xl': ['2rem', { lineHeight: '2.5rem' }],
      '4xl': ['2.5rem', { lineHeight: '3rem' }],
      '5xl': ['3rem', { lineHeight: '3.5rem' }],
      '6xl': ['3.75rem', { lineHeight: '1' }],
      '7xl': ['4.5rem', { lineHeight: '1' }],
      '8xl': ['6rem', { lineHeight: '1' }],
      '9xl': ['8rem', { lineHeight: '1' }],
    },
    fontFamily: {
      sans: ['var(--font-inter)', 'ui-serif'],
      display: ['var(--font-lexend)', { fontFeatureSettings: '"ss01"' }],
    },
    maxWidth: {
      '8xl': '88rem',
    },
    extend: {
      textColor: {
        'dark-blue': '#0F172A',
        'light-blue': '#7dd3fc',
        'logo-blue': '#64A8C9',
      },
      colors: {
        'dark-blue': '#0F172A',
      },
      maxWidth: {
        'sm': '640px',
        'md': '768px',
        'blog': '960px',
        'lg': '1024px',
        'xl': '1280px',
        '8xl': '88rem',
    },
    keyframes: {
      movearound: {
        '0%, 100%': { transform: 'scale(1)' },
        '50%': { transform: 'scale(1.5)' },
      },
      movearoundtwo: {
        '0%, 100%': { transform: 'scale(1.5)' },
        '50%': { transform: 'scale(4)' },
      },
      fadeOut: {
        '0%': {  opacity: '0.5', transform: 'translateY(20px)' },
        '100%': {  opacity: '1', transform: 'translateY(0)' },
      }
    },
    animation: {
      movearound: 'movearound 6s ease-in-out infinite',
      movearoundtwo: 'movearound 10s ease-in-out infinite',
      fade: 'fadeOut 0.8s ease-in-out',
    }
    },

    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }
      'md': '768px',
      // => @media (min-width: 768px) { ... }
      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }
      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }
      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
      '3xl': '1720px'
    }

    
  },
};
export default config;