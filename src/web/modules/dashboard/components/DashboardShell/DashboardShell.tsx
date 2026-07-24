import React, { useMemo } from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import DashboardBalance, {
  BALANCE_HEIGHT
} from '@common/modules/dashboard/components/DashboardBalance'
import DashboardHeader from '@common/modules/dashboard/components/DashboardHeader'
import { OverviewBackground } from '@common/modules/dashboard/components/DashboardOverview/OverviewBackground'
import RefreshIcon from '@common/modules/dashboard/components/DashboardOverview/RefreshIcon'
import Routes from '@common/modules/dashboard/components/Routes'
import TokensSkeleton from '@common/modules/dashboard/components/Tokens/TokensSkeleton'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  getCachedDashboardBalance,
  isCachedDashboardBalanceStale
} from '@web/modules/dashboard/helpers/dashboardBalanceCache'
import commonWebStyles from '@web/styles/utils/common'

// Instant placeholder shown while the data-heavy controllers load
const DashboardShell = () => {
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { isPrivacyModeEnabled } = useController('WalletStateController').state

  // Read synchronously so the shell paints the last-known balance on its first render.
  // Keyed on the current address (and TTL-checked), so a value from another account
  // can never leak in after switching accounts elsewhere.
  const cachedBalance = useMemo(() => getCachedDashboardBalance(account?.addr), [account?.addr])

  // Show a skeleton when there's no fresh cache, or the last stored balance had
  // balance-affecting errors/warnings (it may be inaccurate).
  const showBalanceSkeleton = !cachedBalance || cachedBalance.hasBalanceAffectingErrors
  const isCachedBalanceStale = useMemo(
    () => (cachedBalance ? isCachedDashboardBalanceStale(cachedBalance) : false),
    [cachedBalance]
  )

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
              {/* Mirror the balance row (BALANCE_HEIGHT) in DashboardOverview 1:1 so
              swapping the shell for the real overview causes no vertical shift. A fresh,
              error-free cached balance shows pulsing; once it's older than 5 minutes a
              spinner is added on the left, the same way the overview shows a reload. */}
              <View style={[{ height: BALANCE_HEIGHT }, flexbox.center, spacings.mbMi]}>
                <DashboardBalance
                  variant={showBalanceSkeleton ? 'skeleton' : 'cached'}
                  totalAmount={cachedBalance?.totalBalance || 0}
                  color="#FFFFFF"
                  isPrivacyModeEnabled={isPrivacyModeEnabled}
                  badge={
                    !showBalanceSkeleton && isCachedBalanceStale ? (
                      <View style={spacings.mrTy}>
                        <RefreshIcon spin color="#E3E6EB" width={20} height={20} />
                      </View>
                    ) : null
                  }
                />
              </View>
              {/* The gas-tank balance is never cached, so it always loads as a skeleton.
              Matches the GasTankButton loading skeleton and the balance block's margin. */}
              <View style={spacings.mb}>
                <SkeletonLoader lowOpacity width={80} height={26} borderRadius={12} />
              </View>
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
