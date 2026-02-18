import loadEnv from 'utils/env/loadEnv'
import parseEnv from 'utils/env/parseEnv'

const envVariables = loadEnv()

// EOA (+7702) env variables
export const baParams = parseEnv(envVariables, 'BA')
// Smart Account env variables
export const saParams = parseEnv(envVariables, 'SA')

export const BA_ADDRESS = envVariables.BA_SELECTED_ACCOUNT
export const SA_ADDRESS = envVariables.SA_SELECTED_ACCOUNT
export const KEYSTORE_PASS = envVariables.KEYSTORE_PASS
export const SEED = envVariables.SEED
export const SEED24 = envVariables.SEED_24_WORDS
export const PRIVATE_KEY = envVariables.PRIVATE_KEY
