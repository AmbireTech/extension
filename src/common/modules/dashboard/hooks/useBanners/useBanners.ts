import { useMemo } from 'react'

import { getCurrentAccountBanners } from '@ambire-common/libs/banners/banners'
import useController from '@common/hooks/useController'

import type { Banner as BannerInterface, IBannerController } from '@ambire-common/interfaces/banner'
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
  const { bannersData: marketingBannersData } = useController('BannerController').state
  const {
    state: { account, portfolio, deprecatedSmartAccountBanner }
  } = useController('SelectedAccountController')

  const { banners: emailVaultBanners = [] } = useController('EmailVaultController').state
  const { banners: requestBanners = [] } = useController('RequestsController').state
  const { banners: swapAndBridgeBanners = [] } = useController('SwapAndBridgeController').state
  const { extensionUpdateBanner } = useController('ExtensionUpdateController').state
  const { hasFundedHotAccount } = useController('PortfolioController').state

  const marketingBanners = useMemo(() => {
    return marketingBannersData.banners.filter(
      // if the banner is not a survey banner there is no need to hide it
      // but for surveys we have other requirements that are acc specific
      // the acc comparing is used to hide the fact that banners are not updated at the
      // selected same time as the acc
      (b) => b.actions[0]?.actionName !== 'survey' || marketingBannersData.account === account?.addr
    )
  }, [account?.addr, marketingBannersData.account, marketingBannersData.banners])

  const controllerBanners = useMemo(() => {
    return [
      ...(deprecatedSmartAccountBanner || []),
      ...(requestBanners || []),
      ...(isOffline && portfolio.isAllReady ? [OFFLINE_BANNER] : []),
      ...(isOffline ? [] : [...(swapAndBridgeBanners || [])]),
      ...getCurrentAccountBanners(
        hasFundedHotAccount ? emailVaultBanners || [] : [],
        account?.addr
      ),
      ...(extensionUpdateBanner || [])
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
