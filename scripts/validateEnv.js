const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const ROOT_DIR = path.join(__dirname, '..')
const PRODUCTION_APP_ENV = 'production'

/** The builds that inline the env. Each one requires its own set of variables. */
const ENV_TARGETS = {
  EXTENSION: 'extension',
  MOBILE: 'mobile'
}

// The .env-sample comments that mark the next variable as required, and for which builds
const REQUIRED_MARKERS = [
  {
    marker: '🟢 REQUIRED FOR PRODUCTION',
    targets: [ENV_TARGETS.EXTENSION, ENV_TARGETS.MOBILE]
  },
  { marker: '🟢 REQUIRED FOR EXTENSION PRODUCTION', targets: [ENV_TARGETS.EXTENSION] },
  { marker: '🟢 REQUIRED FOR MOBILE PRODUCTION', targets: [ENV_TARGETS.MOBILE] }
]

const IMPORTANT_PRODUCTION_VARIABLES_TO_DOUBLE_CHECK = [
  { name: 'RELAYER_URL', value: 'https://relayer.ambire.com' },
  { name: 'VELCRO_URL', value: 'https://relayer.ambire.com/velcro-v3' }
]

/**
 * Turns the `RELAYER_CUSTOM_HEADERS` value into a headers object. An empty value gives no
 * headers. Throws when the value is not a JSON object with string values. The error never
 * contains the value, because it can be a secret.
 */
const parseRelayerCustomHeaders = (value) => {
  if (!value) return {}

  let headers
  try {
    headers = JSON.parse(value)
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    throw new Error('RELAYER_CUSTOM_HEADERS must be a JSON object with string values')
  }

  const isObject = typeof headers === 'object' && headers !== null && !Array.isArray(headers)
  if (!isObject || !Object.values(headers).every((header) => typeof header === 'string')) {
    throw new Error('RELAYER_CUSTOM_HEADERS must be a JSON object with string values')
  }

  return headers
}

/**
 * Throws when `RELAYER_CUSTOM_HEADERS` is set in a CI build. CI builds are the ones that
 * reach users or public sites, and the headers get inlined in plain text.
 */
const validateRelayerCustomHeaders = (envValues) => {
  const headers = parseRelayerCustomHeaders(envValues.RELAYER_CUSTOM_HEADERS)
  if (!Object.keys(headers).length || !envValues.CI) return

  throw new Error('RELAYER_CUSTOM_HEADERS must not be set in a CI build')
}

/**
 * Gives a hash of `RELAYER_CUSTOM_HEADERS` for the bundler cache keys. Babel inlines the
 * value, so without it a cached transform keeps the old headers after the value changes.
 */
const getRelayerCustomHeadersCacheKey = (envValues) =>
  crypto
    .createHash('sha256')
    .update(envValues.RELAYER_CUSTOM_HEADERS || '')
    .digest('hex')

/**
 * Gives the names of the variables `.env-sample` marks as required for the given build target.
 */
const getRequiredEnvVariables = (envSampleContent, target) => {
  // Split by newlines and filter out empty lines
  const lines = envSampleContent.split('\n').filter((line) => line.trim())

  const requiredVars = []
  let isRequired = false

  lines.forEach((line) => {
    // Check if line is a comment
    if (line.trim().startsWith('#')) {
      // Check if this comment marks a variable as required for this target
      const requiredMarker = REQUIRED_MARKERS.find(({ marker }) => line.includes(marker))
      if (requiredMarker && requiredMarker.targets.includes(target)) isRequired = true
      return
    }

    // Parse variable line
    const [key, value] = line.split('=')
    if (key && value) {
      const varName = key.trim()
      if (isRequired) requiredVars.push(varName)
      isRequired = false
    }
  })

  return requiredVars
}

/**
 * Throws when a required variable is missing or empty, or when a production build points
 * an important variable anywhere but production.
 */
const validateEnvValues = (envValues, requiredVariables, environment) => {
  requiredVariables.forEach((variable) => {
    if (!envValues[variable] || envValues[variable] === '""') {
      throw new Error(`Missing required environment variable: ${variable}`)
    } else if (environment === PRODUCTION_APP_ENV) {
      const value = envValues[variable]
      const productionVariable = IMPORTANT_PRODUCTION_VARIABLES_TO_DOUBLE_CHECK.find(
        (v) => v.name === variable
      )

      if (productionVariable && productionVariable.value !== value) {
        throw new Error(`Invalid production environment variable: ${variable} = ${value}`)
      }
    }
  })
}

/**
 * Validates the env a build inlines. Reads only the process env, because the callers load the
 * `.env` files into it first. Expo CLI does that before metro reads its config, and the webpack
 * config through `dotenv`. CI passes its values through the process env, so a `.env` file is
 * optional. Throws on the first problem found.
 */
const validateEnvVariables = (environment, target) => {
  const envSampleContent = fs.readFileSync(path.join(ROOT_DIR, '.env-sample'), 'utf8')

  validateEnvValues(process.env, getRequiredEnvVariables(envSampleContent, target), environment)
}

module.exports = {
  ENV_TARGETS,
  PRODUCTION_APP_ENV,
  getRelayerCustomHeadersCacheKey,
  getRequiredEnvVariables,
  parseRelayerCustomHeaders,
  validateEnvValues,
  validateEnvVariables,
  validateRelayerCustomHeaders
}
