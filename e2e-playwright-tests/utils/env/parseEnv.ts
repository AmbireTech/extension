type Prefix = 'SA' | 'BA' | 'LEDGER' | 'LEDGER_SA'

const PREFIXES: Prefix[] = ['SA', 'BA', 'LEDGER', 'LEDGER_SA']

const parseEnv = (envVariables: Record<string, string>, prefix: Prefix) => {
  if (!PREFIXES.includes(prefix)) {
    throw new Error(`Invalid ${prefix}. Expected 'SA', 'BA', 'LEDGER' or 'LEDGER_SA'`)
  }

  return {
    parsedKeystoreAccounts: JSON.parse(envVariables[`${prefix}_ACCOUNTS`]),
    parsedKeystoreUID: envVariables[`${prefix}_KEYSTORE_UID`],
    parsedKeystoreKeys: JSON.parse(envVariables[`${prefix}_KEYS`]),
    parsedKeystoreSecrets: JSON.parse(envVariables[`${prefix}_SECRETS`]),
    parsedKeystoreSeeds: JSON.parse(envVariables[`${prefix}_SEEDS`]),
    parsedLearnedAssets: JSON.parse(envVariables[`${prefix}_LEARNED_ASSETS`]),
    envSelectedAccount: envVariables[`${prefix}_SELECTED_ACCOUNT`]
  }
}

export default parseEnv
