/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af', // Deep blue for healthcare
        secondary: '#0891b2', // Teal accent
        success: '#10b981', // Emerald for safety
        warning: '#f59e0b', // Amber for caution
        danger: '#ef4444', // Red for alerts
        background: '#f8fafc', // Light slate
        surface: '#ffffff', // White
        'text-primary': '#1e293b', // Dark slate
        'text-secondary': '#64748b', // Gray slate
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
}
