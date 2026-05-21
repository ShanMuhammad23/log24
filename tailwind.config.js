const AppFontFamily = {
  regular: 'FamiljenGrotesk_400Regular',
  medium: 'FamiljenGrotesk_500Medium',
  semibold: 'FamiljenGrotesk_600SemiBold',
  bold: 'FamiljenGrotesk_700Bold',
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './contexts/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      fontFamily: {
        sans: [AppFontFamily.regular],
        'familjen-regular': [AppFontFamily.regular],
        'familjen-medium': [AppFontFamily.medium],
        'familjen-semibold': [AppFontFamily.semibold],
        'familjen-bold': [AppFontFamily.bold],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      // React Native: use explicit font files instead of fontWeight + single family
      addUtilities({
        '.font-sans': {
          fontFamily: AppFontFamily.regular,
        },
        '.font-normal': {
          fontFamily: AppFontFamily.regular,
        },
        '.font-medium': {
          fontFamily: AppFontFamily.medium,
        },
        '.font-semibold': {
          fontFamily: AppFontFamily.semibold,
        },
        '.font-bold': {
          fontFamily: AppFontFamily.bold,
        },
      });
    },
  ],
};
