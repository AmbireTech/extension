import { useMemo } from 'react'

import { Banner as BannerInterface } from '@ambire-common/interfaces/banner'
import { getCurrentAccountBanners } from '@ambire-common/libs/banners/banners'
import useController from '@common/hooks/useController'
import useBannersControllerState from '@web/hooks/useBannersControllerState'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'

const OFFLINE_BANNER: BannerInterface = {
  id: 'offline-banner',
  type: 'error',
  title: 'Network Issue',
  text: 'Your network connection is too slow or you may be offline. Please check your internet connection.',
  actions: [
    {
      actionName: 'reload-selected-account',
      label: 'Retry'
    }
  ]
}

export default function useBanners(): [BannerInterface[], BannerInterface[]] {
  const { isOffline } = useController('MainController').state
  const { banners: marketingBanners } = useBannersControllerState()
  const {
    state: { account, portfolio, deprecatedSmartAccountBanner }
  } = useController('SelectedAccountController')

  const { banners: emailVaultBanners = [] } = useEmailVaultControllerState()
  const { banners: requestBanners = [] } = useRequestsControllerState()
  const { banners: swapAndBridgeBanners = [] } = useSwapAndBridgeControllerState()
  const { extensionUpdateBanner } = useController('ExtensionUpdateController').state
  const { hasFundedHotAccount } = usePortfolioControllerState()

  const controllerBanners = useMemo(() => {
    return [
      ...deprecatedSmartAccountBanner,
      ...requestBanners,
      ...(isOffline && portfolio.isAllReady ? [OFFLINE_BANNER] : []),
      ...(isOffline ? [] : [...swapAndBridgeBanners]),
      ...getCurrentAccountBanners(hasFundedHotAccount ? emailVaultBanners : [], account?.addr),
      ...extensionUpdateBanner
    ]
  }, [
    deprecatedSmartAccountBanner,
    requestBanners,
    isOffline,
    portfolio.isAllReady,
    swapAndBridgeBanners,
    hasFundedHotAccount,
    emailVaultBanners,
    account?.addr,
    extensionUpdateBanner
  ])

  return [controllerBanners, marketingBanners]
}
