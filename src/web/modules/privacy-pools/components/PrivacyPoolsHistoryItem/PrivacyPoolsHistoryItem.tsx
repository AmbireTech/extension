import { formatUnits } from 'ethers'
import React, { FC, useCallback, useMemo } from 'react'
import { View, ViewStyle } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { getPrivacyPoolsAsset } from '@ambire-common/consts/privacyPools'
import {
  PrivacyPoolsHistoryEntry,
  PrivacyPoolsHistoryEntryType
} from '@ambire-common/interfaces/privacyPools'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Badge from '@common/components/Badge'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useMultiHover } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import { getFormattedSubmittedDate } from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/helpers'
import InteractionAddress from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/InteractionAddress'
import StatusBadge from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/StatusBadge'
import getSummaryStyles from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/styles'
import { DappInteractionIcon } from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/SummaryIcons'
import { DappInteraction } from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/types'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary/sizeMultiplier'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import PrivacyPoolsHistoryDetailsSheet from '@web/modules/privacy-pools/components/PrivacyPoolsHistoryDetailsSheet'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  entry: PrivacyPoolsHistoryEntry
  style?: ViewStyle
}

const SIZE = 'md'

/** In wallet terms: a deposit is what the account received, a withdrawal what it sent. */
const TITLES: { [type in PrivacyPoolsHistoryEntryType]: string } = {
  deposit: 'Received',
  withdrawal: 'Sent',
  ragequit: 'Rage quit'
}

const ICON_TYPES: { [type in PrivacyPoolsHistoryEntryType]: DappInteraction['iconType'] } = {
  deposit: 'receive',
  withdrawal: 'send',
  ragequit: 'send'
}

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

/**
 * One event of a Privacy Pools account's history, laid out like the regular activity's
 * `SubmittedTransactionSummary`. Opens its details, as the regular one does.
 */
const PrivacyPoolsHistoryItem: FC<Props> = ({ entry, style }) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getSummaryStyles)
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { ref: sheetRef, open: openSheet, close: closeDetails } = useModalize()
  // Not passed as is: the press event would be read as where to open the sheet
  const openDetails = useCallback(() => openSheet(), [openSheet])

  const network = useMemo(
    () => networks.find(({ chainId }) => chainId.toString() === entry.chainId),
    [networks, entry.chainId]
  )
  const submittedDate = useMemo(() => getFormattedSubmittedDate(entry.timestamp), [entry.timestamp])

  // A pool added before we list it: the raw amount rather than nothing, as in the balances
  const asset = getPrivacyPoolsAsset(BigInt(entry.chainId), entry.tokenAddress)
  const symbol = asset?.symbol || t('Unknown token')
  const fullAmount = formatUnits(entry.amount, asset?.decimals ?? 0)
  const isIncoming = entry.type === 'deposit'

  const [bindAnim, animStyle] = useMultiHover({
    values: [
      {
        property: 'backgroundColor',
        from: theme.secondaryBackground,
        to: theme.tertiaryBackground
      }
    ]
  })

  if (!network) return null

  return (
    <>
      <AnimatedPressable
        onPress={openDetails}
        style={[
          styles.container,
          { paddingTop: SPACING_SM * sizeMultiplier[SIZE] },
          style,
          animStyle
        ]}
        {...bindAnim}
      >
        <View style={[styles.header, spacings.phSm]}>
          {entry.isUnderReview ? (
            <Badge
              size="md"
              type="warning"
              weight="medium"
              text={t('Being verified')}
              withRightSpacing
            />
          ) : (
            <StatusBadge status={AccountOpStatus.Success} textSize={12} />
          )}
          <View style={styles.headerMeta}>
            <Text
              fontSize={12}
              appearance="secondaryText"
              numberOfLines={1}
              style={styles.headerMetaText}
            >
              {t('{{date}} on {{network}}', { date: submittedDate, network: network.name })}
            </Text>
            <NetworkIcon
              id={entry.chainId}
              size={20 * sizeMultiplier[SIZE]}
              style={{ ...spacings.mlMi, ...styles.networkIcon }}
            />
          </View>
        </View>
        <View
          style={[
            spacings.mvSm,
            spacings.mhSm,
            { height: 1, backgroundColor: theme.secondaryBorder }
          ]}
        />
        <View style={styles.contentContainer}>
          <View style={[styles.dappInteractionsColumn, spacings.mrSm]}>
            <View style={styles.dappInteractionRow}>
              <DappInteractionIcon
                interaction={{ id: entry.id, name: '', iconType: ICON_TYPES[entry.type] }}
              />
              <View>
                <Text fontSize={14} weight="semiBold">
                  {t(TITLES[entry.type])}
                </Text>
                {!!entry.counterpartyAddr && (
                  <View style={[flexbox.alignCenter, flexbox.directionRow]}>
                    <Text fontSize={12} appearance="secondaryText">
                      {isIncoming ? t('from ') : t('to ')}
                    </Text>
                    <InteractionAddress address={entry.counterpartyAddr} />
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={[styles.balanceChangesRightColumn, styles.balanceChangeRow]}>
            <Text
              fontSize={12}
              weight="medium"
              appearance={isIncoming ? 'successText' : 'errorText'}
              style={{ cursor: 'pointer' }}
              dataSet={createGlobalTooltipDataSet({
                id: `privacy-pools-history-${entry.id}`,
                content: fullAmount
              })}
            >
              {`${isIncoming ? '+' : '-'}${formatDecimals(parseFloat(fullAmount), 'amount')}`}
            </Text>
            <Text fontSize={12} weight="medium" appearance="secondaryText" style={spacings.mlTy}>
              {symbol}
            </Text>
            <View style={spacings.mlTy}>
              <TokenIcon
                width={13}
                height={13}
                withContainer
                containerHeight={16}
                containerWidth={16}
                withNetworkIcon={false}
                address={entry.tokenAddress}
                chainId={BigInt(entry.chainId)}
              />
            </View>
          </View>
        </View>
      </AnimatedPressable>
      <PrivacyPoolsHistoryDetailsSheet
        sheetRef={sheetRef}
        closeBottomSheet={closeDetails}
        entry={entry}
        network={network}
      />
    </>
  )
}

export default React.memo(PrivacyPoolsHistoryItem)
