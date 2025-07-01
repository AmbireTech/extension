const REQUIRED_ENV_VARIABLES = [
  'BA_ACCOUNTS',
  'BA_KEYSTORE_UID',
  'BA_KEYS',
  'BA_SECRETS',
  'BA_SEEDS',
  'BA_NETWORK_WITH_ASSETS',
  'BA_NETWORK_WITH_POSITIONS',
  'BA_ONBOARDING_STATE',
  'BA_PREVIOUSHINTS',
  'BA_SELECTED_ACCOUNT',
  'BA_TERMSTATE',
  'SA_ACCOUNTS',
  'SA_IS_ONBOARDED',
  'SA_KEYSTORE_UID',
  'SA_KEYS',
  'SA_SECRETS',
  'SA_SEEDS',
  'SA_NETWORK_WITH_ASSETS',
  'SA_NETWORK_WITH_POSITIONS',
  'SA_ONBOARDING_STATE',
  'SA_PREVIOUSHINTS',
  'SA_SELECTED_ACCOUNT',
  'SA_TERMSTATE',
  'BA_PRIVATE_KEY',
  'SEED',
  'SEED_24_WORDS'
]

const validateEnv = (envVariables) => {
  REQUIRED_ENV_VARIABLES.forEach((variable) => {
    if (!Object.hasOwn(envVariables, variable) || envVariables[variable] === undefined) {
      throw new Error(`Missing required environment variable: ${variable}`)
    }
  })
}

export default validateEnv
