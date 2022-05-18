module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    fontFamily: {
      serif: ['Spectral', 'serif'],
      mono: ['Azeret Mono', 'monospace'],
      sans: ['sans-serif']
    },
    colors: {
      'dark-green': 'rgb(65,100,85)',
      'white': '#ffffff',
      'black': '#000000'
    },
    extend: {
      keyframes: {
        'fade-in': {
          '0%': {opacity: 0},
          '100%': {opacity: 1}
        },
        'fade-up': {
          '0%': {transform: 'translateY(30px)', opacity: 0},
          '100%': {transform: 'translateY(0)', opacity: 1}
        }
      },
      animation: {
        'fade-in': 'fade-in ease-out 1s forwards',
        'fade-up': 'fade-up ease-out 1s forwards'
      },
      boxShadow: {
        'xl': '0px 0px 32px 5px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
