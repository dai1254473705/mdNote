/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // 支持手动切换暗黑模式
  theme: {
    extend: {
      colors: {
        // 自定义主题色扩展
        primary: {
          DEFAULT: 'var(--color-primary)',
          foreground: 'var(--color-primary-foreground)',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
