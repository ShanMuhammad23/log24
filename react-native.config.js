/**
 * Disable Google Sign-In native autolinking unless Web Client ID is set at build time.
 * Prevents production crashes when the native module is linked but not configured.
 */
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
const googleSignInEnabled =
  googleWebClientId.length > 0 && !googleWebClientId.startsWith('YOUR_GOOGLE');

module.exports = {
  dependencies: googleSignInEnabled
    ? {}
    : {
        '@react-native-google-signin/google-signin': {
          platforms: {
            android: null,
            ios: null,
          },
        },
      },
};
