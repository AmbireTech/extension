import React from 'react'
import { View } from 'react-native'

import LayoutWrapper from '@common/components/LayoutWrapper'
import SkeletonLoader from '@common/components/SkeletonLoader'
import useWindowSize from '@common/hooks/useWindowSize'
import DashboardOverviewSkeleton from '@common/modules/dashboard/components/DashboardOverview/Skeleton'
import TabsAndSearchSkeleton from '@common/modules/dashboard/components/TabsAndSearch/Skeleton'
import TokensSkeleton from '@common/modules/dashboard/components/Tokens/TokensSkeleton'
import useBanners from '@common/modules/dashboard/hooks/useBanners'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'
import commonWebStyles from '@web/styles/utils/common'

const { isTab } = getUiType()

const Skeleton = () => {
  const { minWidthSize } = useWindowSize()
  const [controllerBanners] = useBanners()

  return (
    <LayoutWrapper>
      <View style={[flexbox.flex1, isTab && minWidthSize('l') && spacings.phSm]}>
        <DashboardOverviewSkeleton />
        <View style={[commonWebStyles.contentContainer, spacings.phSm, spacings.ptTy]}>
          {controllerBanners.map((banner) => (
            <SkeletonLoader key={banner.id} height={61} width="100%" style={spacings.mbTy} />
          ))}
          <TabsAndSearchSkeleton />
          <TokensSkeleton />
        </View>
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(Skeleton)
