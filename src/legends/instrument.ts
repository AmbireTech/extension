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
    environment: CONFIG.APP_ENV || 'unknown'
  })
