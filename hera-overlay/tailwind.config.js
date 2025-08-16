/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/src/**/*.{js,ts,jsx,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Press Start 2P"', 'cursive'],
        'press-start': ['"Press Start 2P"', 'cursive']
      },
      colors: {
        primary: 'rgb(242, 242, 247)',
        secondary: 'rgb(199, 199, 204)',
        tertiary: 'rgb(142, 142, 147)',
        divider: 'rgb(72, 72, 74)',
        gray: {
          DEFAULT: 'rgb(142, 142, 147)',
          2: 'rgb(99, 99, 102)',
          3: 'rgb(72, 72, 74)',
          4: 'rgb(58, 58, 60)',
          5: 'rgb(44, 44, 46)',
          6: 'rgb(28, 28, 30)'
        },
        black: 'rgb(28, 28, 30)',
        white: 'rgb(242, 242, 247)',
        base: 'rgb(0, 0, 0)',
        background: 'rgb(28, 28, 30)',
        foreground: 'rgb(242, 242, 247)',
        red: 'rgb(255, 79, 68)',
        orange: 'rgb(255, 169, 20)',
        yellow: 'rgb(255, 224, 20)',
        green: 'rgb(60, 225, 85)',
        mint: 'rgb(108, 224, 219)',
        teal: 'rgb(68, 212, 237)',
        cyan: 'rgb(90, 205, 250)',
        blue: 'rgb(20, 142, 255)',
        indigo: 'rgb(99, 97, 242)',
        purple: 'rgb(204, 101, 255)',
        pink: 'rgb(255, 65, 105)',
        brown: 'rgb(182, 152, 114)'
      }
    }
  },
  plugins: []
};
