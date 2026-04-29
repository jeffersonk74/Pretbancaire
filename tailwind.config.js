/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bank-deep-blue': '#0f172a',
        'bank-primary': '#1e3a8a',
        'bank-blue': '#2563eb',
        'bank-royal-blue': '#3b82f6',
        'bank-light-blue': '#dbeafe',
      },
    },
  },
  plugins: [],
}
