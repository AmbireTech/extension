import Constants from 'expo-constants'
import * as SentryLib from 'sentry-expo'

import CONFIG from '@config/env'

// Ref to access all @sentry/react-native exports:
const Sentry = SentryLib.Native

SentryLib.init({
  dsn: CONFIG.SENTRY_DSN,
  // In order to use the published release source maps with Issues in Sentry,
  // set your Expo revisionId as the Sentry release identifier:
  release: Constants?.manifest?.revisionId || 'N/A',
  // Match an error to a specific environment
  environment: CONFIG.APP_ENV
  // TODO:
  // We get a lot of "Network request failed" or similar errors from users.
  // They are connected to network problems of the users.
  // Having these issues in Sentry does not really help us.
  // These errors are not really valuable to use
  // and crowd the view on real issues. So ignore them all.
  // {@link https://github.com/getsentry/sentry/issues/12676#issuecomment-533538114}
  // ignoreErrors: ['Network request failed'],
  // Use these two for debugging purposed only
  // enableInExpoDevelopment: true
  // If `true`, Sentry will try to print out useful debugging information,
  // uncomment when debugging only
  // debug: true
})

export const setUserContext = (u: SentryLib.Native.User) => Sentry.setUser(u)

export const captureException = (e: any) => Sentry.captureException(e)
export const captureMessage = (message: string) => Sentry.captureMessage(message)
