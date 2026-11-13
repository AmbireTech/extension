import useController from '@common/hooks/useController'
import useDappVerificationHoldButtonType from '@common/hooks/useDappVerificationHoldButtonType'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectCurrentRequestDappVerificationBanners = (
  state: AllControllersMappingType['RequestsController']
) => state.currentRequestDappVerificationBanners

/**
 * Scam checker warnings for the app behind the current add network, add token, get encryption
 * public key or decrypt request, and the hold-to-proceed button type that goes with them.
 */
const useCurrentRequestDappSafety = () => {
  const { state: banners } = useController(
    'RequestsController',
    selectCurrentRequestDappVerificationBanners
  )
  const holdToProceedButtonType = useDappVerificationHoldButtonType(banners)

  return {
    banners: banners || [],
    hasSafetyBanners: !!banners?.length,
    holdToProceedButtonType
  }
}

export default useCurrentRequestDappSafety
