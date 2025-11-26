/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared-ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('../../packages/shared-ui/tailwind.config.js')],
  theme: {
    extend: {},
  },
  plugins: [],
};
