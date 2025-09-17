import { useMemo } from 'react'

import { Banner as BannerInterface } from '@ambire-common/interfaces/banner'
import { getCurrentAccountBanners } from '@ambire-common/libs/banners/banners'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBannersControllerState from '@web/hooks/useBannersControllerState'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
import useExtensionUpdateControllerState from '@web/hooks/useExtensionUpdateControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
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
  const { isOffline } = useMainControllerState()
  const { banners: marketingBanners } = useBannersControllerState()
  const { account, portfolio, deprecatedSmartAccountBanner, firstCashbackBanner } =
    useSelectedAccountControllerState()

  const { banners: emailVaultBanners = [] } = useEmailVaultControllerState()
  const { banners: requestBanners = [] } = useRequestsControllerState()
  const { banners: actionBanners = [] } = useActionsControllerState()
  const { banners: swapAndBridgeBanners = [] } = useSwapAndBridgeControllerState()
  const { extensionUpdateBanner } = useExtensionUpdateControllerState()
  const { banners: selectedAccountBanners } = useSelectedAccountControllerState()

  const controllerBanners = useMemo(() => {
    return [
      ...deprecatedSmartAccountBanner,
      ...requestBanners,
      ...actionBanners,
      ...(isOffline && portfolio.isAllReady ? [OFFLINE_BANNER] : []),
      ...(isOffline ? [] : [...swapAndBridgeBanners]),
      ...getCurrentAccountBanners(emailVaultBanners, account?.addr),
      ...selectedAccountBanners,
      ...extensionUpdateBanner,
      ...firstCashbackBanner
    ]
  }, [
    deprecatedSmartAccountBanner,
    requestBanners,
    actionBanners,
    isOffline,
    portfolio.isAllReady,
    swapAndBridgeBanners,
    emailVaultBanners,
    account?.addr,
    selectedAccountBanners,
    extensionUpdateBanner,
    firstCashbackBanner
  ])

  return [controllerBanners, marketingBanners]
}
