/**
 * Always autolink Google Sign-In so store / production builds include the native module.
 * Runtime configure() still requires EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in the JS bundle.
 */
module.exports = {
  dependencies: {},
};
