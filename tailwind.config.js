/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: '#02de0a',
        secondary: '#0602de',
        accent: '#6002db',
        background: '#131924',
        text: '#dddddd',
      },
      boxShadow: {
        'light': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'medium': '0 6px 12px rgba(0, 0, 0, 0.2)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #02de0a 0%, #0602de 33%, #6002db 100%)',
      },
    },
  },
  plugins: [],
};