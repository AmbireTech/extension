import { useContext } from 'react'

import { BannerControllerStateContext } from '@web/contexts/bannerControllerStateContext'

export default function useBannersControllerState() {
  const context = useContext(BannerControllerStateContext)

  if (!context) {
    throw new Error(
      'useBannersControllerState must be used within an BannersControllerStateProvider'
    )
  }

  return context
}
