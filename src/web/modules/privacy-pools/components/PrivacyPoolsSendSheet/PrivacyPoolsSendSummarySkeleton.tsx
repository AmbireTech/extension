import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import { PrivacyPoolsBroadcaster } from '@ambire-common/interfaces/privacyPools'
import SkeletonLoader from '@common/components/SkeletonLoader'
import useTheme from '@common/hooks/useTheme'
import { sizeMultiplier } from '@common/modules/sign-account-op/components/TransactionSummary/sizeMultiplier'
import { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

/** The summary's size in the sheet, which the spacing below is scaled by. */
const SUMMARY_SIZE_MULTIPLIER = sizeMultiplier.md
const SUMMARY_BORDER_WIDTH = 1
/** As tall as the summary's title and its rows, so the sheet does not move once it is proved. */
const TITLE_HEIGHT = 24
const ROW_HEIGHT = 20
const TITLE_BAR_WIDTH = 44
const TITLE_BAR_HEIGHT = 16
const VALUE_BAR_WIDTH = 88
const BAR_HEIGHT = 12

type SkeletonRow = { label: string; labelWidth: number; hasSeparatorBefore?: boolean }

const AMOUNT_ROWS: SkeletonRow[] = [
  { label: 'amount-to-send', labelWidth: 96 },
  { label: 'recipient-receives', labelWidth: 112 },
  { label: 'recipient', labelWidth: 64, hasSeparatorBefore: true }
]

/** The rows of `humanizePrivacyPoolsWithdrawal`: only 0xBow's relayers take a service fee. */
const ROWS: { [broadcaster in PrivacyPoolsBroadcaster]: SkeletonRow[] } = {
  '0xbow': [
    ...AMOUNT_ROWS,
    { label: 'service-fee', labelWidth: 72, hasSeparatorBefore: true },
    { label: 'network-fee', labelWidth: 80 }
  ],
  kohaku: [...AMOUNT_ROWS, { label: 'network-fee', labelWidth: 80, hasSeparatorBefore: true }]
}

interface Props {
  broadcaster: PrivacyPoolsBroadcaster
  style?: ViewStyle
}

/**
 * Stands in for the summary of a Privacy Pools transfer while it is proved: the same card, title
 * and rows, so the summary takes its place without moving the sheet.
 */
const PrivacyPoolsSendSummarySkeleton: FC<Props> = ({ broadcaster, style }) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        common.borderRadiusPrimary,
        {
          backgroundColor: theme.secondaryBackground,
          borderWidth: SUMMARY_BORDER_WIDTH,
          borderColor: theme.secondaryBorder,
          paddingHorizontal: SPACING_SM,
          paddingVertical: SPACING_SM * SUMMARY_SIZE_MULTIPLIER
        },
        style
      ]}
    >
      <View style={[flexbox.justifyCenter, { height: TITLE_HEIGHT }]}>
        <SkeletonLoader
          width={TITLE_BAR_WIDTH}
          height={TITLE_BAR_HEIGHT}
          appearance="tertiaryBackground"
        />
      </View>
      <View style={{ marginTop: SPACING_TY * SUMMARY_SIZE_MULTIPLIER }}>
        {ROWS[broadcaster].map(({ label, labelWidth, hasSeparatorBefore }) => (
          <React.Fragment key={label}>
            {hasSeparatorBefore && (
              <View
                style={{
                  height: 1,
                  backgroundColor: theme.secondaryBorder,
                  marginTop: SPACING_SM * SUMMARY_SIZE_MULTIPLIER
                }}
              />
            )}
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                flexbox.justifySpaceBetween,
                { height: ROW_HEIGHT, marginTop: SPACING_SM * SUMMARY_SIZE_MULTIPLIER }
              ]}
            >
              <SkeletonLoader
                width={labelWidth}
                height={BAR_HEIGHT}
                appearance="tertiaryBackground"
              />
              <SkeletonLoader
                width={VALUE_BAR_WIDTH}
                height={BAR_HEIGHT}
                appearance="tertiaryBackground"
              />
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  )
}

export default React.memo(PrivacyPoolsSendSummarySkeleton)
