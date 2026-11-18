import { useMemo } from 'react'

import { HoldToProceedButtonProps } from '@common/components/HoldToProceedButton'
import useController from '@common/hooks/useController'
import useDappVerificationHoldButtonType from '@common/hooks/useDappVerificationHoldButtonType'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectCurrentRequestDappVerificationBanners = (
  state: AllControllersMappingType['RequestsController']
) => state.currentRequestDappVerificationBanners

/**
 * Scam checker warnings for the app behind the current add network, add token, get encryption
 * public key or decrypt request, and the hold-to-proceed button that goes with them.
 * `holdToProceed` is set only when there are warnings, so the request can't be approved by accident.
 */
const useCurrentRequestDappSafety = ({
  text,
  completeText
}: Pick<HoldToProceedButtonProps, 'text' | 'completeText'>) => {
  const { state: banners } = useController(
    'RequestsController',
    selectCurrentRequestDappVerificationBanners
  )
  const holdToProceedButtonType = useDappVerificationHoldButtonType(banners)
  const hasSafetyBanners = !!banners?.length

  const holdToProceed = useMemo(() => {
    if (!hasSafetyBanners) return undefined

    return { text, completeText, buttonType: holdToProceedButtonType }
  }, [hasSafetyBanners, text, completeText, holdToProceedButtonType])

  return {
    banners: banners || [],
    holdToProceed
  }
}

export default useCurrentRequestDappSafety
