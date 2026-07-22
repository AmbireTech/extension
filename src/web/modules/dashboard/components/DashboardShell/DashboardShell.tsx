import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import DashboardHeader from '@common/modules/dashboard/components/DashboardHeader'
import { OverviewBackground } from '@common/modules/dashboard/components/DashboardOverview/OverviewBackground'
import Routes from '@common/modules/dashboard/components/Routes'
import TokensSkeleton from '@common/modules/dashboard/components/Tokens/TokensSkeleton'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import commonWebStyles from '@web/styles/utils/common'

// Instant placeholder shown while the data-heavy controllers load
const DashboardShell = () => {
  const {
    state: { account }
  } = useController('SelectedAccountController')

  return (
    <>
      <View style={[spacings.phSm, spacings.mbTy]}>
        <View
          style={[
            common.borderRadiusPrimary,
            spacings.ptTy,
            isWeb && spacings.phSm,
            // Not a variable but makes it match DashboardOverview exactly 1:1
            { paddingBottom: 14 },
            { overflow: 'hidden' }
          ]}
        >
          <OverviewBackground address={account?.addr || ''} />
          <View style={{ zIndex: 2 }}>
            <DashboardHeader />
            <View style={[flexbox.alignCenter, spacings.pt]}>
              {/* Mirror the balance row (BALANCE_HEIGHT) and its skeleton in DashboardOverview
              1:1 so swapping the shell for the real overview causes no vertical shift. */}
              <SkeletonLoader
                lowOpacity
                width={180}
                height={40}
                borderRadius={8}
                style={spacings.mbMi}
              />
              {/* Matches the GasTankButton loading skeleton and the balance block's bottom margin. */}
              <SkeletonLoader
                lowOpacity
                width={80}
                height={26}
                borderRadius={12}
                style={spacings.mb}
              />
              <Routes />
            </View>
          </View>
        </View>
      </View>
      <View style={[commonWebStyles.contentContainer, spacings.phSm, { paddingRight: 16 }]}>
        <TokensSkeleton />
      </View>
    </>
  )
}

export default React.memo(DashboardShell)
