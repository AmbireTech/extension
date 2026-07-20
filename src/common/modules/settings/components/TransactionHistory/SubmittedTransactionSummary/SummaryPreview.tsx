import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import TokenOrNft from '@common/components/TokenOrNft'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import {
  formatBalanceChangeAmount,
  getBalanceChangeTooltipId,
  getFullBalanceChangeAmount
} from './helpers'
import InteractionAddress from './InteractionAddress'
import getStyles from './styles'
import { BalanceChangeToken, DappInteractionIcon } from './SummaryIcons'
import { DappInteraction, DisplayBalanceChange, SubmittedAccountOpLike } from './types'

const SummaryPreview = ({
  submittedAccountOp,
  dappInteractions,
  visibleBalanceChanges,
  hiddenBalanceChangesCount,
  shouldShowBalanceChangesSummary
}: {
  submittedAccountOp: SubmittedAccountOpLike
  dappInteractions: DappInteraction[]
  visibleBalanceChanges: DisplayBalanceChange[]
  hiddenBalanceChangesCount: number
  shouldShowBalanceChangesSummary: boolean
}) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()

  return (
    <View style={styles.contentContainer}>
      <View
        style={[
          styles.dappInteractionsColumn,
          shouldShowBalanceChangesSummary ? spacings.mrSm : undefined
        ]}
      >
        {dappInteractions.length ? (
          <>
            {dappInteractions.map((interaction, index) => (
              <View
                key={interaction.id}
                style={[
                  styles.dappInteractionRow,
                  index < dappInteractions.length - 1 ? spacings.mbTy : undefined
                ]}
              >
                <DappInteractionIcon interaction={interaction} />
                <View>
                  <Text fontSize={14} weight="semiBold">
                    {interaction.name}
                  </Text>
                  {(!!interaction.address || !!interaction.description) && (
                    <View style={[flexbox.alignCenter, flexbox.directionRow]}>
                      <Text fontSize={12} appearance="secondaryText">
                        {t('to ')}
                      </Text>
                      {!!interaction.address && (
                        <InteractionAddress address={interaction.address} />
                      )}
                      {!!interaction.description && (
                        <Text fontSize={12} appearance="secondaryText">
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
        <View style={styles.balanceChangesRightColumn}>
          {visibleBalanceChanges.map((change, index) => (
            <View
              key={`${change.address}-${change.balanceChange.toString()}`}
              style={[
                styles.balanceChangeRow,
                index < visibleBalanceChanges.length - 1 || hiddenBalanceChangesCount
                  ? spacings.mbTy
                  : null
              ]}
            >
              <Text
                fontSize={12}
                weight="medium"
                appearance={change.balanceChange > 0n ? 'successText' : 'errorText'}
                style={{ cursor: 'pointer' }}
                dataSet={createGlobalTooltipDataSet({
                  id: getBalanceChangeTooltipId(change, submittedAccountOp),
                  content: getFullBalanceChangeAmount(change)
                })}
              >
                {formatBalanceChangeAmount(change)}
              </Text>
              <Text fontSize={12} weight="medium" appearance="secondaryText" style={spacings.mlTy}>
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
