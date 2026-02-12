import { useMemo } from 'react'

import { Banner as BannerInterface } from '@ambire-common/interfaces/banner'
import { getCurrentAccountBanners } from '@ambire-common/libs/banners/banners'
import useController from '@common/hooks/useController'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
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
  const { banners: marketingBanners } = useController('BannerController').state
  const {
    state: { account, portfolio, deprecatedSmartAccountBanner }
  } = useController('SelectedAccountController')

  const { banners: emailVaultBanners = [] } = useEmailVaultControllerState()
  const { banners: requestBanners = [] } = useController('RequestsController').state
  const { banners: swapAndBridgeBanners = [] } = useSwapAndBridgeControllerState()
  const { extensionUpdateBanner } = useController('ExtensionUpdateController').state
  const { hasFundedHotAccount } = useController('PortfolioController').state

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
