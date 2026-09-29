import type { FeatureFlags } from '@ambire-common/consts/featureFlags'

const getFeatureFlagUpdates = (
  flag: keyof FeatureFlags,
  isEnabling: boolean
): Partial<FeatureFlags> => {
  if (flag === 'gasTank') {
    return isEnabling ? { gasTank: true, erc4337: true, tokenPrices: true } : { gasTank: false }
  }

  if (flag === 'erc4337') {
    return isEnabling ? { erc4337: true, tokenPrices: true } : { erc4337: false, gasTank: false }
  }

  if (flag === 'tokenPrices' && !isEnabling) {
    return { tokenPrices: false, erc4337: false, gasTank: false }
  }

  return { [flag]: isEnabling }
}

export default getFeatureFlagUpdates
