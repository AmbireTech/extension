const parseEnv = (envVariables, prefix: 'SA' | 'BA') => {
  if (prefix !== 'SA' && prefix !== 'BA') {
    throw new Error(`Invalid ${prefix}. Expected 'SA' or 'BA'`)
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
