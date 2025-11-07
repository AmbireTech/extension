import CONFIG from '@common/config/env'
import { SENTRY_DSN_LEGENDS } from '@env'
import * as Sentry from '@sentry/react'

import packageJsonData from '../ambire-common/package.json'

const version = packageJsonData.version

if (SENTRY_DSN_LEGENDS)
  Sentry.init({
    dsn: SENTRY_DSN_LEGENDS,

    // Adds request headers and IP for users, for more info visit:
    // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#sendDefaultPii
    sendDefaultPii: false,
    release: `legends@${version}`,
    integrations: [],
    environment: CONFIG.APP_ENV || 'unknown',
    beforeSend(event) {
      const exception = event.exception?.values?.[0]
      const lastFilenameFromStackTrace = exception?.stacktrace?.frames?.slice(-1)[0]?.filename || ''
      // filenames of errors from browser extensions start with
      // chrome-extension:// and moz-extension:// for chrome- and firefox-based browsers
      if (
        lastFilenameFromStackTrace.startsWith('chrome-extension://') ||
        lastFilenameFromStackTrace.startsWith('moz-extension://')
      ) {
        return null // Drop the event
      }
      return event
    }
  })
