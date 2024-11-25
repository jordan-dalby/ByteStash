/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'light-bg': '#f1f5f9',
        'light-surface': '#e2e8f0',
        'light-border': '#cbd5e1',
        'light-text': '#1e293b',
        'light-text-secondary': '#475569',
        'light-primary': '#2563eb',
        'light-hover': '#cbd5e1',

        'dark-bg': '#0f172a',
        'dark-surface': '#1e293b',
        'dark-border': '#334155',
        'dark-text': '#e2e8f0',
        'dark-text-secondary': '#94a3b8',
        'dark-primary': '#60a5fa',
        'dark-hover': '#334155',
      },
    },
  },
  plugins: [],
}
