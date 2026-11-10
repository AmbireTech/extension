import type { FeatureFlags } from '@ambire-common/consts/featureFlags'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/**
 * Builds a selector telling whether the user hasn't opted out of `flag`. True until the
 * controller's state has arrived, matching the controllers in the background that treat a
 * missing flag as enabled. Build it once, outside the component, so the selector is stable.
 */
const createSelectIsFeatureEnabled =
  (flag: keyof FeatureFlags) =>
  (state: AllControllersMappingType['FeatureFlagsController'] | undefined) =>
    state?.flags?.[flag] !== false

/** Whether the user hasn't opted out of token prices */
export const selectIsTokenPricesEnabled = createSelectIsFeatureEnabled('tokenPrices')

/** Whether the user hasn't opted out of the Email Vault */
export const selectIsEmailVaultEnabled = createSelectIsFeatureEnabled('emailVault')
