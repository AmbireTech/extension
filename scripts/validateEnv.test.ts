import {
  ENV_TARGETS,
  getRequiredEnvVariables,
  PRODUCTION_APP_ENV,
  validateEnvValues
} from './validateEnv'

const ENV_SAMPLE = `
# Shared
# 🟢 REQUIRED FOR PRODUCTION
RELAYER_URL="https://relayer.ambire.com"

# Extension only
# 🟢 REQUIRED FOR EXTENSION PRODUCTION
BROWSER_EXTENSION_PUBLIC_KEY=""

# Not required
DEBUG_FLAG="false"

# Mobile only
# 🟢 REQUIRED FOR MOBILE PRODUCTION
SENTRY_DSN_MOBILE=""
`

const PRODUCTION_RELAYER_URL = 'https://relayer.ambire.com'
const STAGING_RELAYER_URL = 'https://staging-relayer.ambire.com'

describe('getRequiredEnvVariables', () => {
  it('requires shared and extension-only variables for the extension', () => {
    expect(getRequiredEnvVariables(ENV_SAMPLE, ENV_TARGETS.EXTENSION)).toEqual([
      'RELAYER_URL',
      'BROWSER_EXTENSION_PUBLIC_KEY'
    ])
  })

  it('requires shared and mobile-only variables for the mobile app', () => {
    expect(getRequiredEnvVariables(ENV_SAMPLE, ENV_TARGETS.MOBILE)).toEqual([
      'RELAYER_URL',
      'SENTRY_DSN_MOBILE'
    ])
  })
})

describe('validateEnvValues', () => {
  const requiredVariables = ['RELAYER_URL', 'SENTRY_DSN_MOBILE']

  it('passes when every required variable is set to its production value', () => {
    expect(() =>
      validateEnvValues(
        { RELAYER_URL: PRODUCTION_RELAYER_URL, SENTRY_DSN_MOBILE: 'https://key@sentry.test/4' },
        requiredVariables,
        PRODUCTION_APP_ENV
      )
    ).not.toThrow()
  })

  it('names the variable that is missing or empty', () => {
    expect(() =>
      validateEnvValues(
        { RELAYER_URL: PRODUCTION_RELAYER_URL, SENTRY_DSN_MOBILE: '' },
        requiredVariables,
        PRODUCTION_APP_ENV
      )
    ).toThrow('Missing required environment variable: SENTRY_DSN_MOBILE')
  })

  it('rejects a production build pointing at a non-production relayer', () => {
    expect(() =>
      validateEnvValues(
        { RELAYER_URL: STAGING_RELAYER_URL, SENTRY_DSN_MOBILE: 'https://key@sentry.test/4' },
        requiredVariables,
        PRODUCTION_APP_ENV
      )
    ).toThrow(`Invalid production environment variable: RELAYER_URL = ${STAGING_RELAYER_URL}`)
  })
})
