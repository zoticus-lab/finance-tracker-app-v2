/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glass: '0 24px 80px rgba(15, 23, 42, 0.12)',
      },
      backgroundImage: {
        'hero-glow': 'radial-gradient(circle at top left, rgba(16, 185, 129, 0.18), transparent 32%), radial-gradient(circle at top right, rgba(34, 197, 94, 0.14), transparent 28%), linear-gradient(135deg, rgba(248, 250, 252, 1), rgba(236, 253, 245, 1))',
      },
    },
  },
  plugins: [],
};
