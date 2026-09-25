import React, { FC, useCallback, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'

import { PrivacyPoolsUnavailableReason } from '@ambire-common/interfaces/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useSelectedAccountColorSeed from '@common/hooks/useSelectedAccountColorSeed'
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

interface Props {
  unavailableReason: PrivacyPoolsUnavailableReason | null
  /**
   * Whether any network has been read for this recovery phrase. Distinct from being able to use
   * Privacy Pools at all: reading a network is asked for per network and can take a long time on
   * Ethereum, so the card is on screen well before there is a balance to put in it.
   */
  hasSyncedAnyChain: boolean
  isSyncing: boolean
  /**
   * The pooled balance in USD - the part the association set has approved, matching the rows below.
   * Kept apart from the public portfolio's total on purpose: the pooled side is read on demand, so
   * merging the two would make the headline balance depend on whether this screen was opened.
   */
  totalPrivateBalance: number
  // Value still waiting on the association set, so excluded from the total above. Surfaced rather
  // than folded in, because it genuinely cannot be withdrawn privately yet.
  pendingPrivateBalance: number
  canSend: boolean
  onRefresh: () => void
  onSend: () => void
}

const selectTokenPricesEnabled = (state: IFeatureFlagsController) => state.flags?.tokenPrices

// The card's contents sit on the dark OverviewBackground, so they use the fixed light colors the
// dashboard overview uses rather than theme ones
const PRIMARY_TEXT_COLOR = '#FFFFFF'
const SECONDARY_TEXT_COLOR = '#F2F4F7'
const ICON_COLOR = '#E3E6EB'
const REFRESH_BUTTON_SIZE = 28

/**
 * The Privacy Pools account's counterpart of `DashboardOverview`: the same card, header, balance
 * and route buttons, with what a Privacy Pools account has in them.
 */
const PrivacyPoolsOverview: FC<Props> = ({
  unavailableReason,
  hasSyncedAnyChain,
  isSyncing,
  totalPrivateBalance,
  pendingPrivateBalance,
  canSend,
  onRefresh,
  onSend
}) => {
  const { t } = useTranslation()
  const {
    state: { isPrivacyModeEnabled },
    dispatch: walletStateDispatch
  } = useController('WalletStateController')
  const { state: isTokenPricesEnabled } = useController(
    'FeatureFlagsController',
    selectTokenPricesEnabled
  )
  // The gradient is seeded with the selected Privacy Pools account, so each one keeps a card of
  // its own the way each regular account does.
  const backgroundColorSeed = useSelectedAccountColorSeed()
  const [isBalanceHovered, setIsBalanceHovered] = useState(false)

  const togglePrivacyMode = useCallback(() => {
    walletStateDispatch({ type: 'method', params: { method: 'togglePrivacyMode', args: [] } })
  }, [walletStateDispatch])

  // The reasons Privacy Pools can't be used are structural (no Privacy Pools account selected, no
  // supported network) or temporary (locked), so each gets its own explanation rather than a disabled button
  // with no hint.
  const unavailableLabel = useMemo(() => {
    if (!unavailableReason) return ''

    const labels: { [reason in PrivacyPoolsUnavailableReason]: string } = {
      'no-account': t('Select a Privacy Pools account to see what it holds.'),
      'unsupported-network': t(
        'Privacy Pools is not available on any of the networks you have added. It runs on Ethereum and on the Sepolia test network.'
      ),
      locked: t('Unlock your wallet to see what you have in Privacy Pools.')
    }

    return labels[unavailableReason]
  }, [unavailableReason, t])

  // Shown on hover, like the dashboard's, and while reading - the balance is not final until then.
  // Reads every supported network again, the same as opening the account does.
  const shouldShowRefreshButton = hasSyncedAnyChain && (isBalanceHovered || isSyncing)

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
                      color={PRIMARY_TEXT_COLOR}
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
                {/* Qualifies the figure above rather than adding to it: part of the balance cannot
                be withdrawn privately yet. Without it a total that silently omits money reads as a
                complete one. */}
                {!isPrivacyModeEnabled && pendingPrivateBalance > 0 && (
                  <Text fontSize={12} color={SECONDARY_TEXT_COLOR} numberOfLines={1}>
                    {t('+{{value}} waiting to be approved', {
                      value: formatDecimals(pendingPrivateBalance, 'value')
                    })}
                  </Text>
                )}
              </View>
            )}
            {/* Sending needs the notes read first: without them there is nothing to send, and the
            form would have an empty dropdown. */}
            <PrivacyPoolsActions onSend={onSend} isSendDisabled={!canSend} />
          </View>
        </View>
      </View>
    </View>
  )
}

export default React.memo(PrivacyPoolsOverview)
