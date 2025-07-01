import loadEnv from 'utils/env/loadEnv'
import parseEnv from 'utils/env/parseEnv'

const envVariables = loadEnv()

// EOA (+7702) env variables
export const baParams = parseEnv(envVariables, 'BA')
// Smart Account env variables
export const saParams = parseEnv(envVariables, 'SA')

export const BA_ADDRESS = envVariables.BA_SELECTED_ACCOUNT
export const BA_PASSPHRASE = envVariables.BA_PASSPHRASE
export const SA_PASSPHRASE = envVariables.SA_PASSPHRASE
export const KEYSTORE_PASS = envVariables.KEYSTORE_PASS
export const BA_PRIVATE_KEY = envVariables.BA_PRIVATE_KEY
