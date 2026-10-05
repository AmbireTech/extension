import React, { FC, useCallback, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'

import { PrivacyPoolsUnavailableReason } from '@ambire-common/interfaces/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useSelectedAccountColorSeed from '@common/hooks/useSelectedAccountColorSeed'
import useTheme from '@common/hooks/useTheme'
import DashboardBalance, {
  BALANCE_HEIGHT
} from '@common/modules/dashboard/components/DashboardBalance'
import DashboardHeader from '@common/modules/dashboard/components/DashboardHeader'
import { OverviewBackground } from '@common/modules/dashboard/components/DashboardOverview/OverviewBackground'
import RefreshIcon from '@common/modules/dashboard/components/DashboardOverview/RefreshIcon'
import spacings, { SPACING } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import PrivacyPoolsActions from './PrivacyPoolsActions'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'
import type { WalletStateController } from '@common/controllers/wallet-state'

interface Props {
  unavailableReason: PrivacyPoolsUnavailableReason | null
  /** Whether any network has been read. A first read can take long, so the card shows before it. */
  hasSyncedAnyChain: boolean
  isSyncing: boolean
  /** Whether a network could not be read, so the balance may be incomplete. */
  hasSyncError: boolean
  /** Whether reading waits for the recovery phrase backup - see `syncIfStale`. */
  isWaitingForBackup: boolean
  /** USD value of the approved part, matching the rows below. */
  totalPrivateBalance: number
  // USD value still waiting on the association set, excluded from the total above
  pendingPrivateBalance: number
  canSend: boolean
  onRefresh: () => void
  onSend: () => void
}

const selectTokenPricesEnabled = (state: IFeatureFlagsController) => state.flags?.tokenPrices
const selectIsPrivacyModeEnabled = (state: WalletStateController) => state.isPrivacyModeEnabled

// Fixed light colors, not theme ones: the card sits on the dark OverviewBackground
const PRIMARY_TEXT_COLOR = '#FFFFFF'
const SECONDARY_TEXT_COLOR = '#F2F4F7'
const ICON_COLOR = '#E3E6EB'
const REFRESH_BUTTON_SIZE = 28

/** `DashboardOverview` for a Privacy Pools account. */
const PrivacyPoolsOverview: FC<Props> = ({
  unavailableReason,
  hasSyncedAnyChain,
  isSyncing,
  hasSyncError,
  isWaitingForBackup,
  totalPrivateBalance,
  pendingPrivateBalance,
  canSend,
  onRefresh,
  onSend
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state: isPrivacyModeEnabled, dispatch: walletStateDispatch } = useController(
    'WalletStateController',
    selectIsPrivacyModeEnabled
  )
  const { state: isTokenPricesEnabled } = useController(
    'FeatureFlagsController',
    selectTokenPricesEnabled
  )
  // Seeded per account, so each one has its own gradient like regular accounts
  const backgroundColorSeed = useSelectedAccountColorSeed()
  const [isBalanceHovered, setIsBalanceHovered] = useState(false)

  const togglePrivacyMode = useCallback(() => {
    walletStateDispatch({ type: 'method', params: { method: 'togglePrivacyMode', args: [] } })
  }, [walletStateDispatch])

  // Each reason gets its own explanation rather than a disabled button with no hint
  const unavailableLabel = useMemo(() => {
    // Otherwise the balance would stay a placeholder; the banner under the card does the backup
    if (!unavailableReason && isWaitingForBackup)
      return t('Back up the recovery phrase to load this account.')
    if (!unavailableReason) return ''

    const labels: { [reason in PrivacyPoolsUnavailableReason]: string } = {
      'no-account': t('Select a Privacy Pools account to see what it holds.'),
      'unsupported-network': t(
        'Privacy Pools is not available on any of the networks you have added. It runs on Ethereum.'
      ),
      locked: t('Unlock your wallet to see what you have in Privacy Pools.')
    }

    return labels[unavailableReason]
  }, [unavailableReason, isWaitingForBackup, t])

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
        <OverviewBackground address={backgroundColorSeed} />
        <View style={{ zIndex: 2 }}>
          <DashboardHeader />
          <View style={[flexbox.alignCenter, spacings.pt]}>
            {unavailableLabel ? (
              <Text
                fontSize={14}
                color={SECONDARY_TEXT_COLOR}
                style={[spacings.mb, { textAlign: 'center' }]}
              >
                {unavailableLabel}
              </Text>
            ) : (
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
                      variant={!hasSyncedAnyChain ? 'skeleton' : 'ready'}
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
                {/* Otherwise the total, which omits this part, reads as complete */}
                {!isPrivacyModeEnabled && pendingPrivateBalance > 0 && (
                  <Text fontSize={12} color={SECONDARY_TEXT_COLOR} numberOfLines={1}>
                    {t('+{{value}} waiting to be approved', {
                      value: formatDecimals(pendingPrivateBalance, 'value')
                    })}
                  </Text>
                )}
              </View>
            )}
            {/* Disabled until the notes are read, or the form would have an empty dropdown */}
            <PrivacyPoolsActions onSend={onSend} isSendDisabled={!canSend} />
          </View>
        </View>
      </View>
    </View>
  )
}

export default React.memo(PrivacyPoolsOverview)
