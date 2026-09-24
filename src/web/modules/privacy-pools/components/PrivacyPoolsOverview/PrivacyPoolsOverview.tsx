import React, { FC, useMemo } from 'react'
import { Pressable, View } from 'react-native'

import { PrivacyPoolsUnavailableReason } from '@ambire-common/interfaces/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { OverviewBackground } from '@common/modules/dashboard/components/DashboardOverview/OverviewBackground'
import RefreshIcon from '@common/modules/dashboard/components/DashboardOverview/RefreshIcon'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { privateValue } from '@common/utils/ui'

import PrivacyPoolsActions from './PrivacyPoolsActions'
import getStyles, { HERO_AMOUNT_HEIGHT, OVERVIEW_COLORS } from './styles'

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
  const { styles } = useTheme(getStyles)
  const {
    state: { isPrivacyModeEnabled }
  } = useController('WalletStateController')
  // The gradient is seeded with the selected Privacy Pools account, so each one keeps a card of
  // its own the way each regular account does.
  const {
    state: { privacyPoolsAccountId }
  } = useController('SelectedAccountController')

  // Split so the cents can be rendered smaller than the dollars, the same way the dashboard's
  // balance is presented.
  const [integerValue, decimalValue] = useMemo(
    () => formatDecimals(totalPrivateBalance, 'value').split('.'),
    [totalPrivateBalance]
  )

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

  return (
    <View style={styles.container}>
      <OverviewBackground address={privacyPoolsAccountId || ''} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <InvisibilityIcon width={20} height={20} color={OVERVIEW_COLORS.primaryText} />
            {/* No network in the title: the balance spans every supported network, and each row
            below carries its own network badge - see PrivacyPoolsBalances. */}
            <Text
              fontSize={14}
              weight="medium"
              color={OVERVIEW_COLORS.primaryText}
              style={spacings.mlTy}
            >
              {t('Privacy Pools')}
            </Text>
          </View>
          {/* Refreshes only the networks already read - a first read is started from its own row,
          since on Ethereum it is long enough that it must be asked for rather than triggered by a
          refresh button. */}
          {hasSyncedAnyChain && (
            <Pressable
              testID="privacy-pools-refresh-button"
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={isSyncing}
              hitSlop={10}
            >
              <RefreshIcon spin={isSyncing} color={OVERVIEW_COLORS.icon} width={24} height={24} />
            </Pressable>
          )}
        </View>

        {unavailableLabel ? (
          <View style={styles.unavailableContainer}>
            <Text
              fontSize={14}
              color={OVERVIEW_COLORS.secondaryText}
              style={styles.unavailableText}
            >
              {unavailableLabel}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.heroAmountRow}>
                {isSyncing && !hasSyncedAnyChain ? (
                  <SkeletonLoader
                    lowOpacity
                    width={160}
                    height={HERO_AMOUNT_HEIGHT}
                    borderRadius={8}
                  />
                ) : (
                  <View style={[flexbox.directionRow, flexbox.alignEnd]}>
                    <Text
                      fontSize={34}
                      shouldScale={false}
                      weight="number_bold"
                      color={OVERVIEW_COLORS.primaryText}
                      style={styles.heroAmount}
                      testID="privacy-pools-balance"
                    >
                      {privateValue(integerValue, isPrivacyModeEnabled, 4)}
                    </Text>
                    {!!decimalValue && !isPrivacyModeEnabled && (
                      <Text
                        fontSize={20}
                        shouldScale={false}
                        weight="number_bold"
                        color={OVERVIEW_COLORS.primaryText}
                        style={styles.heroDecimals}
                      >
                        {`.${decimalValue}`}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Qualifies the figure above rather than adding to it: part of the balance cannot be
              withdrawn privately yet. Without it a total that silently omits money reads as a
              complete one. */}
              {!isPrivacyModeEnabled && pendingPrivateBalance > 0 && (
                <Text fontSize={12} color={OVERVIEW_COLORS.secondaryText} numberOfLines={1}>
                  {t('+{{value}} waiting to be approved', {
                    value: formatDecimals(pendingPrivateBalance, 'value')
                  })}
                </Text>
              )}
            </View>

            {/* Sending needs the notes read first: without them there is nothing to send, and the
            form would have an empty dropdown. */}
            <PrivacyPoolsActions onSend={onSend} isSendDisabled={!canSend} />
          </>
        )}
      </View>
    </View>
  )
}

export default React.memo(PrivacyPoolsOverview)
