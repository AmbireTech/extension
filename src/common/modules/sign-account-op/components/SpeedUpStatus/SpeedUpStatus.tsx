import React, { memo, useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'

import CheckIcon from '@common/assets/svg/CheckIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

// The smallest unit shown is a minute, so there's no need to refresh more often
const REFRESH_INTERVAL_MS = 30000
const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

type Props = {
  /** When the pending transaction that is being sped up was sent, in milliseconds */
  sentAt?: number
  /** The pending transaction was processed before the speed up, so there's nothing to speed up */
  isCompleted?: boolean
  /** The pending transaction is being canceled rather than sped up */
  isCancel?: boolean
}

/**
 * Shown under the title of the sign screen during a speed up,
 * so it's clear whether the transaction being replaced is still waiting.
 */
const SpeedUpStatus = ({ sentAt, isCompleted, isCancel }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (sentAt === undefined || isCompleted) return

    const interval = setInterval(() => setNow(Date.now()), REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isCompleted, sentAt])

  const statusText = useMemo(() => {
    if (sentAt === undefined) return t('Still waiting')

    const elapsedMs = Math.max(now - sentAt, 0)
    if (elapsedMs < MINUTE_MS) return t('Still waiting · sent less than a minute ago')
    if (elapsedMs < HOUR_MS) {
      return t('Still waiting · sent {{count}} min ago', {
        count: Math.floor(elapsedMs / MINUTE_MS)
      })
    }
    if (elapsedMs < DAY_MS) {
      return t('Still waiting · sent {{count}} h ago', { count: Math.floor(elapsedMs / HOUR_MS) })
    }

    return t('Still waiting · sent {{count}} d ago', { count: Math.floor(elapsedMs / DAY_MS) })
  }, [now, sentAt, t])

  if (isCompleted) {
    return (
      <View
        testID="speed-up-status-completed"
        style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtMi]}
      >
        <CheckIcon width={14} height={14} color={theme.successDecorative} style={spacings.mrMi} />
        <Text fontSize={12} appearance="successText" numberOfLines={1}>
          {isCancel
            ? t('Completed · it can no longer be canceled')
            : t('Completed · no need to speed up')}
        </Text>
      </View>
    )
  }

  return (
    <View
      testID="speed-up-status"
      style={[flexbox.directionRow, flexbox.alignCenter, spacings.mtMi]}
    >
      <View
        style={[
          spacings.mrTy,
          { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.warningDecorative }
        ]}
      />
      <Text fontSize={12} appearance="warningText" numberOfLines={1}>
        {statusText}
      </Text>
    </View>
  )
}

export default memo(SpeedUpStatus)
