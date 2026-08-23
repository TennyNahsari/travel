/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'travel-blue': {
          DEFAULT: '#1463FF',
          dark: '#0C4BD4',
          light: '#EBF2FF',
          hover: '#0B52D9',
        },
        'tropical-teal': {
          DEFAULT: '#00AFA0',
          dark: '#008C80',
          light: '#E6F7F5',
        },
        'sunset-orange': {
          DEFAULT: '#FF7A45',
          dark: '#E05E2B',
          light: '#FFF2EC',
        },
        'soft-sky': '#F6F9FC',
        'deep-navy': '#162033',
        'slate-gray': '#667085',
        'soft-sand': '#F3E7D3',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(22, 32, 51, 0.06), 0 2px 6px -1px rgba(22, 32, 51, 0.04)',
        'card': '0 12px 32px -4px rgba(20, 99, 255, 0.08), 0 4px 12px -2px rgba(22, 32, 51, 0.04)',
        'floating': '0 20px 40px -8px rgba(22, 32, 51, 0.12), 0 8px 16px -4px rgba(22, 32, 51, 0.06)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      }
    },
  },
  plugins: [],
}
