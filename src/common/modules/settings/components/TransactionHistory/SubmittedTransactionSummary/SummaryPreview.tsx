import React from 'react'
import { View } from 'react-native'

import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'

import {
  formatBalanceChangeAmount,
  getBalanceChangeTooltipId,
  getFullBalanceChangeAmount
} from './helpers'
import { BalanceChangeToken, DappInteractionIcon } from './SummaryIcons'
import getStyles from './styles'
import { DappInteraction, DisplayBalanceChange } from './types'
import useTheme from '@common/hooks/useTheme'

const SummaryPreview = ({
  submittedAccountOp,
  dappInteractions,
  visibleBalanceChanges,
  hiddenBalanceChangesCount,
  shouldShowBalanceChangesSummary
}: {
  submittedAccountOp: SubmittedAccountOp
  dappInteractions: DappInteraction[]
  visibleBalanceChanges: DisplayBalanceChange[]
  hiddenBalanceChangesCount: number
  shouldShowBalanceChangesSummary: boolean
}) => {
  const { styles } = useTheme(getStyles)

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
                <Text fontSize={14} weight="semiBold">
                  {interaction.name}
                </Text>
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
                // @ts-ignore
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
              +{hiddenBalanceChangesCount} more
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

export default React.memo(SummaryPreview)
