// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  // The Appwrite Functions are plain Node code that is deployed separately from the app.
  ignorePatterns: ['/dist/*', '/functions/**'],
};
