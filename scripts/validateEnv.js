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
  getRequiredEnvVariables,
  validateEnvValues,
  validateEnvVariables
}
