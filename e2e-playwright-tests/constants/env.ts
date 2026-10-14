import loadEnv from 'utils/env/loadEnv'
import parseEnv from 'utils/env/parseEnv'

const envVariables = loadEnv()

// EOA (+7702) env variables
export const baParams = parseEnv(envVariables, 'BA')
// Smart Account env variables
export const saParams = parseEnv(envVariables, 'SA')
// Ledger env variables
export const ledgerBaParams = parseEnv(envVariables, 'LEDGER_BA')
// Ledger SA env variables
export const ledgerSaParams = parseEnv(envVariables, 'LEDGER_SA')

export const BA_ADDRESS = envVariables.BA_SELECTED_ACCOUNT
export const SA_ADDRESS = envVariables.SA_SELECTED_ACCOUNT
export const LEDGER_ADDRESS = envVariables.LEDGER_BA_SELECTED_ACCOUNT
export const KEYSTORE_PASS = envVariables.KEYSTORE_PASS
export const SEED = envVariables.SEED
export const SEED24 = envVariables.SEED_24_WORDS
export const PRIVATE_KEY = envVariables.PRIVATE_KEY
// The mobile app gates fresh installs behind an invite code (useMobileInviteGate).
// This is the e2e suite's own code to unlock it, entered through the UI on every
// test run — distinct from the app's DEFAULT_INVITE_CODE_DEV dev auto-fill, which
// is intentionally disabled whenever IS_TESTING is set.
export const IOS_MOBILE_INVITE_CODE = envVariables.IOS_MOBILE_INVITE_CODE
