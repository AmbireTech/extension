import mainConstants from 'constants/mainConstants'

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
    parsedNetworksWithAssetsByAccount: JSON.parse(envVariables[`${prefix}_NETWORK_WITH_ASSETS`]),
    parsedNetworksWithPositionsByAccount: JSON.parse(
      envVariables[`${prefix}_NETWORK_WITH_POSITIONS`]
    ),
    parsedOnboardingState: JSON.parse(envVariables[`${prefix}_ONBOARDING_STATE`]),
    parsedPreviousHints: JSON.parse(envVariables[`${prefix}_PREVIOUSHINTS`]),
    envSelectedAccount: envVariables[`${prefix}_SELECTED_ACCOUNT`],
    envTermState: envVariables[`${prefix}_TERMSTATE`],
    invite: JSON.stringify(mainConstants.inviteStorageItem),
    ...(prefix === 'SA' && { parsedIsOnBoarded: envVariables[`${prefix}_IS_ONBOARDED`] })
  }
}

export default parseEnv
