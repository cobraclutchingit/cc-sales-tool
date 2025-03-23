module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vigilantex-red': '#7B68EE', // ClickUp's purple (our new primary)
        'vigilantex-black': '#1E1F21', // Dark background
        'brand': {
          'primary': '#7B68EE',
          'secondary': '#8E84FF',
          'accent': '#FF5722',
          'success': '#4DB76A',
          'warning': '#FFB300',
          'error': '#F44336',
        },
      },
      fontFamily: {
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}