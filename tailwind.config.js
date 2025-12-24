/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'air-quality': '#2E86AB',
        'physical-activity': '#06A77D',
        'congestion': '#F18F01',
        'background': '#F8F9FA'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [require("daisyui")],
}
