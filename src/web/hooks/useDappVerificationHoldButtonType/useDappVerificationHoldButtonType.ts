import { useMemo } from 'react'

import { WARNINGS } from '@ambire-common/consts/signAccountOp/errorHandling'
import { DAPP_VERIFICATION_BANNER_IDS } from '@ambire-common/interfaces/dapp'

type ButtonType = 'dangerFilled' | 'warning' | 'primary'

export default function useDappVerificationHoldButtonType(
  banners?: Array<{ id: string }> | null
): ButtonType {
  return useMemo(() => {
    const safeBanners = banners || []

    if (safeBanners.some((banner) => banner.id === DAPP_VERIFICATION_BANNER_IDS.BLACKLISTED))
      return 'dangerFilled'

    if (
      safeBanners.some(
        (banner) =>
          banner.id === DAPP_VERIFICATION_BANNER_IDS.FAILED_TO_GET_OR_UNKNOWN ||
          banner.id === DAPP_VERIFICATION_BANNER_IDS.SUSPICIOUS_HOSTING ||
          banner.id === DAPP_VERIFICATION_BANNER_IDS.LOADING ||
          banner.id === DAPP_VERIFICATION_BANNER_IDS.NOT_IN_CATALOG ||
          banner.id === WARNINGS.significantBalanceDecrease.id
      )
    )
      return 'warning'

    return 'primary'
  }, [banners])
}
