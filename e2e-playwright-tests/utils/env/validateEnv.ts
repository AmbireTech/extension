const REQUIRED_ENV_VARIABLES = [
  // Common for Basic and Smart account
  'PRIVATE_KEY',
  'SEED',
  'SEED_24_WORDS',
  // Basic account:
  'BA_ACCOUNTS',
  'BA_KEYSTORE_UID',
  'BA_KEYS',
  'BA_SECRETS',
  'BA_SEEDS',
  'BA_SELECTED_ACCOUNT',
  'BA_LEARNED_ASSETS',
  // Smart account:
  'SA_ACCOUNTS',
  'SA_KEYSTORE_UID',
  'SA_KEYS',
  'SA_SECRETS',
  'SA_SEEDS',
  'SA_SELECTED_ACCOUNT',
  'SA_LEARNED_ASSETS',
  'SA_ACCOUNT_JSON'
]

const validateEnv = (envVariables) => {
  REQUIRED_ENV_VARIABLES.forEach((variable) => {
    if (!Object.hasOwn(envVariables, variable) || envVariables[variable] === undefined) {
      throw new Error(`Missing required environment variable: ${variable}`)
    }
  })
}

export default validateEnv
