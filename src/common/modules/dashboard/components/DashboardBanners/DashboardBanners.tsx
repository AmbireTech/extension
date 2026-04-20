import React, { useMemo } from 'react'
import { View } from 'react-native'

import { BannerType } from '@ambire-common/interfaces/banner'
import useController from '@common/hooks/useController'
import DashboardBanner from '@common/modules/dashboard/components/DashboardBanners/DashboardBanner/DashboardBanner'
import MarketingBanner from '@common/modules/dashboard/components/DashboardBanners/MarketingBanner/MarketingBanner'
import useBanners from '@common/modules/dashboard/hooks/useBanners'

const DashboardBanners = () => {
  const [controllerBanners, marketingBannersData] = useBanners()
  const {
    state: { account }
  } = useController('SelectedAccountController')

  // this is done solely to prevent the banner being displayed in the first second when acc is switched
  const marketingBanners = useMemo(() => {
    return marketingBannersData.banners.filter(
      (b) => b.actions[0]?.actionName !== 'survey' || marketingBannersData.account === account?.addr
    )
  }, [account?.addr, marketingBannersData.account, marketingBannersData.banners])
  return (
    <View>
      {marketingBanners.map((banner) => (
        <MarketingBanner key={banner.id} banner={banner} />
      ))}
      {controllerBanners.map((banner) => (
        <DashboardBanner key={banner.id} banner={{ ...banner, type: banner.type as BannerType }} />
      ))}
    </View>
  )
}

export default React.memo(DashboardBanners)
