import type { FeatureFlags } from '@ambire-common/consts/featureFlags'

const getFeatureFlagUpdates = (
  flag: keyof FeatureFlags,
  isEnabling: boolean
): Partial<FeatureFlags> => {
  // Token prices are independent of both: while opted out of Ambire's price API, prices are
  // read from the network instead, which is enough for the fees and the Gas Tank
  if (flag === 'gasTank') {
    return isEnabling ? { gasTank: true, erc4337: true } : { gasTank: false }
  }

  if (flag === 'erc4337') {
    return isEnabling ? { erc4337: true } : { erc4337: false, gasTank: false }
  }

  if (flag === 'emailVault') {
    return isEnabling ? { emailVault: true, ambireAnalytics: true } : { emailVault: false }
  }

  if (flag === 'ambireAnalytics' && !isEnabling) {
    return { ambireAnalytics: false, emailVault: false }
  }

  return { [flag]: isEnabling }
}

export default getFeatureFlagUpdates
