import {
  ENV_TARGETS,
  getRequiredEnvVariables,
  parseRelayerCustomHeaders,
  PRODUCTION_APP_ENV,
  validateEnvValues,
  validateRelayerCustomHeaders
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

describe('parseRelayerCustomHeaders', () => {
  it('gives no headers for an empty value', () => {
    expect(parseRelayerCustomHeaders('')).toEqual({})
  })

  it('parses a JSON object with string values', () => {
    expect(parseRelayerCustomHeaders('{"x-test-header":"some-header"}')).toEqual({
      'x-test-header': 'some-header'
    })
  })

  it('rejects a value that is not a JSON object with string values, without leaking it', () => {
    expect(() => parseRelayerCustomHeaders('x-test-header=some-header')).toThrow(
      /must be a JSON object/
    )
    expect(() => parseRelayerCustomHeaders('{"x-test-header":3}')).toThrow(/must be a JSON object/)
  })
})

describe('validateRelayerCustomHeaders', () => {
  const RELAYER_CUSTOM_HEADERS = '{"x-test-header":"some-header"}'

  it('passes in a local build', () => {
    expect(() => validateRelayerCustomHeaders({ RELAYER_CUSTOM_HEADERS })).not.toThrow()
  })

  it('passes in a CI build when no headers are set', () => {
    expect(() => validateRelayerCustomHeaders({ CI: 'true' })).not.toThrow()
  })

  it('rejects the headers in a CI build, without leaking them', () => {
    const envValues = { CI: 'true', RELAYER_CUSTOM_HEADERS }

    expect(() => validateRelayerCustomHeaders(envValues)).toThrow(
      'RELAYER_CUSTOM_HEADERS must not be set in a CI build'
    )
    expect(() => validateRelayerCustomHeaders(envValues)).not.toThrow(/x-test-header|some-header/)
  })
})
