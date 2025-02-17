import Constants from 'expo-constants'

import CONFIG from '@common/config/env'
import * as Sentry from '@sentry/react-native'

// TODO: Crash analytics are currently not implemented in the web context,
// but in case they are needed in future -> if web -> ref `SentryLib.Browser` here.

Sentry.init({
  dsn: CONFIG.SENTRY_DSN,
  // In order to use the published release source maps with Issues in Sentry,
  // set your Expo revisionId as the Sentry release identifier:
  release: Constants?.manifest?.revisionId || 'unspecified',
  // Match an error to a specific environment
  environment: CONFIG.APP_ENV
  // Use these two for debugging purposed only
  // enableInExpoDevelopment: true
  // If `true`, Sentry will try to print out useful debugging information,
  // uncomment when debugging only
  // debug: true
})

export const setUserContext = (u: Sentry.User) => Sentry.setUser(u)

export const captureException = (e: any) => Sentry.captureException(e)
export const captureMessage = (message: string) => Sentry.captureMessage(message)
