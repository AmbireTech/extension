import React, { FC, useCallback, useState } from 'react'
import { Pressable, View } from 'react-native'

import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import DashboardBalance, {
  BALANCE_HEIGHT
} from '@common/modules/dashboard/components/DashboardBalance'
import DashboardHeader from '@common/modules/dashboard/components/DashboardHeader'
import RefreshIcon from '@common/modules/dashboard/components/DashboardOverview/RefreshIcon'
import spacings, { SPACING } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import PrivacyPoolsActions from './PrivacyPoolsActions'
import PrivacyPoolsOverviewBackground from './PrivacyPoolsOverviewBackground'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'
import type { WalletStateController } from '@common/controllers/wallet-state'

interface Props {
  /** Whether any network has been read. A first read can take long, so the card shows before it. */
  hasSyncedAnyChain: boolean
  isSyncing: boolean
  /** Whether a network could not be read, so the balance may be incomplete. */
  hasSyncError: boolean
  /** USD value of the approved and the pending part, matching the rows below. */
  totalPrivateBalance: number
  canSend: boolean
  onRefresh: () => void
  onSend: () => void
}

const selectTokenPricesEnabled = (state: IFeatureFlagsController) => state.flags?.tokenPrices
const selectIsPrivacyModeEnabled = (state: WalletStateController) => state.isPrivacyModeEnabled

// Fixed light colors, not theme ones: the card sits on the dark PrivacyPoolsOverviewBackground
const PRIMARY_TEXT_COLOR = '#FFFFFF'
const ICON_COLOR = '#E3E6EB'
const REFRESH_BUTTON_SIZE = 28

/** `DashboardOverview` for a Privacy Pools account. */
const PrivacyPoolsOverview: FC<Props> = ({
  hasSyncedAnyChain,
  isSyncing,
  hasSyncError,
  totalPrivateBalance,
  canSend,
  onRefresh,
  onSend
}) => {
  const { theme } = useTheme()
  const { state: isPrivacyModeEnabled, dispatch: walletStateDispatch } = useController(
    'WalletStateController',
    selectIsPrivacyModeEnabled
  )
  const { state: isTokenPricesEnabled } = useController(
    'FeatureFlagsController',
    selectTokenPricesEnabled
  )
  const [isBalanceHovered, setIsBalanceHovered] = useState(false)

  const togglePrivacyMode = useCallback(() => {
    walletStateDispatch({ type: 'method', params: { method: 'togglePrivacyMode', args: [] } })
  }, [walletStateDispatch])

  // On hover like the dashboard's, while reading (the balance is not final) and after a failed read
  const shouldShowRefreshButton =
    hasSyncedAnyChain && (isBalanceHovered || isSyncing || hasSyncError)

  return (
    <View style={[spacings.phSm, spacings.mbTy]}>
      <View
        style={[
          common.borderRadiusPrimary,
          spacings.ptTy,
          spacings.phSm,
          { paddingBottom: SPACING, overflow: 'hidden' }
        ]}
      >
        <PrivacyPoolsOverviewBackground />
        <View style={{ zIndex: 2 }}>
          <DashboardHeader />
          <View style={[flexbox.alignCenter, spacings.pt]}>
            <View style={[{ width: '100%' }, spacings.mb, flexbox.alignCenter]}>
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifyCenter,
                  spacings.mbMi,
                  { height: BALANCE_HEIGHT, width: '100%' }
                ]}
                onMouseEnter={() => setIsBalanceHovered(true)}
                onMouseLeave={() => setIsBalanceHovered(false)}
              >
                {/* Placeholder matching the refresh button size to keep the balance centered */}
                <View style={{ width: REFRESH_BUTTON_SIZE, height: REFRESH_BUTTON_SIZE }} />
                <View style={[flexbox.alignCenter, spacings.mhTy]}>
                  <DashboardBalance
                    // Only during the first read: $0.00 otherwise, so the card keeps one height
                    // whether the account is read, empty or waiting for its phrase backup
                    variant={isSyncing && !hasSyncedAnyChain ? 'skeleton' : 'ready'}
                    totalAmount={totalPrivateBalance}
                    isTokenPricesEnabled={isTokenPricesEnabled}
                    color={hasSyncError ? theme.warningDecorative2 : PRIMARY_TEXT_COLOR}
                    isPrivacyModeEnabled={isPrivacyModeEnabled}
                    onPress={togglePrivacyMode}
                    testID="privacy-pools-balance"
                  />
                </View>
                <Pressable
                  testID="privacy-pools-refresh-button"
                  style={({ hovered }: any) => ({
                    width: REFRESH_BUTTON_SIZE,
                    height: REFRESH_BUTTON_SIZE,
                    opacity: shouldShowRefreshButton ? (hovered ? 1 : 0.7) : 0
                  })}
                  onPress={onRefresh}
                  disabled={!hasSyncedAnyChain || isSyncing}
                  onHoverIn={() => setIsBalanceHovered(true)}
                  hitSlop={10}
                >
                  <RefreshIcon
                    spin={isSyncing}
                    color={ICON_COLOR}
                    width={REFRESH_BUTTON_SIZE}
                    height={REFRESH_BUTTON_SIZE}
                  />
                </Pressable>
              </View>
            </View>
            {/* Disabled until the notes are read, or the form would have an empty dropdown */}
            <PrivacyPoolsActions onSend={onSend} isSendDisabled={!canSend} />
          </View>
        </View>
      </View>
    </View>
  )
}

export default React.memo(PrivacyPoolsOverview)
