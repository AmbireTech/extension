import { useMemo } from 'react'

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
        (banner) => banner.id === DAPP_VERIFICATION_BANNER_IDS.FAILED_TO_GET_OR_UNKNOWN
      )
    )
      return 'warning'

    return 'primary'
  }, [banners])
}
