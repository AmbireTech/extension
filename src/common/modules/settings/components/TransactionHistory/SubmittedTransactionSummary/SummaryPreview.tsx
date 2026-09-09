import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import TokenOrNft from '@common/components/TokenOrNft'
import useTheme from '@common/hooks/useTheme'
import useCompactActionRequestLayout from '@common/modules/action-requests/hooks/useCompactActionRequestLayout'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import {
  formatBalanceChangeAmount,
  getBalanceChangeTooltipId,
  getFullBalanceChangeAmount,
  getSummaryBalanceChanges,
  getVisibleSummaryBalanceChanges,
  MAX_VISIBLE_BALANCE_CHANGES
} from './helpers'
import { getDappInteractions } from './humanizedHelpers'
import InteractionAddress from './InteractionAddress'
import getStyles from './styles'
import { BalanceChangeToken, DappInteractionIcon } from './SummaryIcons'
import { SubmittedAccountOpLike } from './types'

const SummaryPreview = ({ submittedAccountOp }: { submittedAccountOp: SubmittedAccountOpLike }) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const { isCompactSidePanelLayout } = useCompactActionRequestLayout()

  const orderedBalanceChanges = useMemo(
    () => getSummaryBalanceChanges(submittedAccountOp),
    [submittedAccountOp]
  )
  const visibleBalanceChanges = useMemo(
    () => getVisibleSummaryBalanceChanges(orderedBalanceChanges),
    [orderedBalanceChanges]
  )
  const hiddenBalanceChangesCount = Math.max(
    orderedBalanceChanges.length - MAX_VISIBLE_BALANCE_CHANGES,
    0
  )
  const shouldShowBalanceChangesSummary = orderedBalanceChanges.length > 0
  const dappInteractions = useMemo(
    () => getDappInteractions(submittedAccountOp),
    [submittedAccountOp]
  )

  return (
    <View style={[styles.contentContainer, isCompactSidePanelLayout && { minWidth: 0 }]}>
      <View
        style={[
          styles.dappInteractionsColumn,
          shouldShowBalanceChangesSummary ? spacings.mrSm : undefined,
          isCompactSidePanelLayout && { minWidth: 0, flexShrink: 1 }
        ]}
      >
        {dappInteractions.length ? (
          <>
            {dappInteractions.map((interaction, index) => (
              <View
                key={interaction.id}
                style={[
                  styles.dappInteractionRow,
                  index < dappInteractions.length - 1 ? spacings.mbTy : undefined,
                  isCompactSidePanelLayout && { minWidth: 0, maxWidth: '100%' }
                ]}
              >
                <DappInteractionIcon interaction={interaction} />
                <View style={isCompactSidePanelLayout ? { flexShrink: 1, minWidth: 0 } : undefined}>
                  <Text
                    fontSize={14}
                    weight="semiBold"
                    numberOfLines={isCompactSidePanelLayout ? 1 : undefined}
                  >
                    {interaction.id === 'fallback:cancel' ? t('Cancel') : interaction.name}
                  </Text>
                  {interaction.safeNonce !== undefined && (
                    <Text fontSize={12} appearance="secondaryText">
                      {t('transaction with nonce {{safeNonce}}', {
                        safeNonce: interaction.safeNonce.toString()
                      })}
                    </Text>
                  )}
                  {(!!interaction.address || !!interaction.description) && (
                    <View
                      style={[
                        flexbox.alignCenter,
                        flexbox.directionRow,
                        isCompactSidePanelLayout && { minWidth: 0 }
                      ]}
                    >
                      <Text
                        fontSize={12}
                        appearance="secondaryText"
                        style={isCompactSidePanelLayout ? { lineHeight: 16 } : undefined}
                      >
                        {t('to ')}
                      </Text>
                      {!!interaction.address && (
                        <InteractionAddress address={interaction.address} />
                      )}
                      {!!interaction.description && (
                        <Text
                          fontSize={12}
                          appearance="secondaryText"
                          numberOfLines={isCompactSidePanelLayout ? 1 : undefined}
                          style={
                            isCompactSidePanelLayout ? { flexShrink: 1, lineHeight: 16 } : undefined
                          }
                        >
                          {interaction.description}
                        </Text>
                      )}
                    </View>
                  )}
                  {interaction.id === 'fallback:gasTank' &&
                    !!interaction.token &&
                    interaction.amount !== undefined && (
                      <View style={[flexbox.alignCenter, flexbox.directionRow]}>
                        <Text fontSize={12} appearance="secondaryText">
                          {t('with ')}
                        </Text>
                        <TokenOrNft
                          value={interaction.amount}
                          address={interaction.token}
                          textSize={12}
                          chainId={submittedAccountOp.chainId}
                          tokenMarginRight={0}
                          tokenIconContainerSize={16}
                        />
                      </View>
                    )}
                </View>
              </View>
            ))}
          </>
        ) : (
          <SkeletonLoader width={120} height={18} />
        )}
      </View>
      {shouldShowBalanceChangesSummary && (
        <View
          style={[
            styles.balanceChangesRightColumn,
            isCompactSidePanelLayout && { flexShrink: 0, ...spacings.mlTy }
          ]}
        >
          {visibleBalanceChanges.map((change, index) => (
            <View
              key={`${change.address}-${change.balanceChange.toString()}`}
              style={[
                styles.balanceChangeRow,
                index < visibleBalanceChanges.length - 1 || hiddenBalanceChangesCount
                  ? spacings.mbTy
                  : null,
                // Custom fontSize clears Text lineHeight; keep row height stable so amounts don't overlap.
                isCompactSidePanelLayout && { minHeight: 18 }
              ]}
            >
              <Text
                fontSize={12}
                weight="medium"
                appearance={change.balanceChange > 0n ? 'successText' : 'errorText'}
                style={{
                  cursor: 'pointer',
                  ...(isCompactSidePanelLayout ? { lineHeight: 16 } : {})
                }}
                dataSet={createGlobalTooltipDataSet({
                  id: getBalanceChangeTooltipId(change, submittedAccountOp),
                  content: getFullBalanceChangeAmount(change)
                })}
              >
                {formatBalanceChangeAmount(change)}
              </Text>
              <Text
                fontSize={12}
                weight="medium"
                appearance="secondaryText"
                style={[spacings.mlTy, isCompactSidePanelLayout && { lineHeight: 16 }]}
              >
                {change.symbol}
              </Text>
              <BalanceChangeToken change={change} />
            </View>
          ))}
          {!!hiddenBalanceChangesCount && (
            <Text fontSize={12} appearance="secondaryText">
              {t('+{{count}} more', { count: hiddenBalanceChangesCount })}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

export default React.memo(SummaryPreview)
