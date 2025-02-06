const { getSentryExpoConfig } = require('@sentry/react-native/metro');

/**
 * Sentry Expo Configuration
 * https://docs.expo.dev/guides/using-sentry/#update-metro-configuration
 *
 */
const config = getSentryExpoConfig(__dirname);

module.exports = config

