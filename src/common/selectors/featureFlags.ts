import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/**
 * Whether the user hasn't opted out of token prices. True until the controller's state has
 * arrived, matching the controllers in the background that treat a missing flag as enabled.
 */
export const selectIsTokenPricesEnabled = (
  state: AllControllersMappingType['FeatureFlagsController'] | undefined
) => state?.flags?.tokenPrices !== false
