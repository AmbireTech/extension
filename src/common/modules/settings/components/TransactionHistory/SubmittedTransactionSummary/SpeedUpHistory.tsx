import React, { memo, useMemo } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import { getFormattedSubmittedDate, getSpeedUpFeeIncreasePercent } from './helpers'
import { SubmittedAccountOpLike } from './types'

/**
 * Shown at the bottom of an Activity row that is speeding up, so it's clear this row stands
 * for the first attempt too, and how much more the speed up pays
 */
const SpeedUpHistory = ({ submittedAccountOp }: { submittedAccountOp: SubmittedAccountOpLike }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  const historyText = useMemo(() => {
    const firstSentAt = submittedAccountOp.meta?.speedUp?.replacedSentAt
    const feeIncreasePercent = getSpeedUpFeeIncreasePercent(submittedAccountOp)
    const firstSentText =
      firstSentAt !== undefined
        ? t('First sent {{date}}', { date: getFormattedSubmittedDate(firstSentAt) })
        : null

    if (firstSentText && feeIncreasePercent !== null) {
      return t('{{firstSent}} · fee raised by {{percent}}%', {
        firstSent: firstSentText,
        percent: feeIncreasePercent
      })
    }
    if (feeIncreasePercent !== null) {
      return t('Fee raised by {{percent}}%', { percent: feeIncreasePercent })
    }

    return firstSentText
  }, [submittedAccountOp, t])

  if (!historyText) return null

  return (
    <View
      testID="speed-up-history"
      style={[
        // The preview above already leaves a gap, so only the line itself is padded
        spacings.mhSm,
        spacings.pvSm,
        { borderTopWidth: 1, borderTopColor: theme.secondaryBorder }
      ]}
    >
      <Text fontSize={12} appearance="secondaryText">
        {historyText}
      </Text>
    </View>
  )
}

export default memo(SpeedUpHistory)
