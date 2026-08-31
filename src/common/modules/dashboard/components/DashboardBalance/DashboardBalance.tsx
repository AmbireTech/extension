import React from 'react'
import { ColorValue, Pressable, View } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import LoadingPulse from '@common/components/LoadingPulse'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import { isiOS, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import flexbox from '@common/styles/utils/flexbox'
import { privateValue } from '@common/utils/ui'

// Shared so both the balance amount and its skeleton have the same height;
// otherwise showing/hiding the refresh button next to it causes a layout shift.
export const BALANCE_HEIGHT = 40
export const BALANCE_SKELETON_WIDTH = 180
export const THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS = 10000

type Variant = 'skeleton' | 'ready' | 'cached'

interface Props {
  totalAmount: number
  color: ColorValue
  isPrivacyModeEnabled: boolean
  // 'skeleton' shows the loading block, 'ready' the live value, 'cached' the last
  // known value with an opacity pulse (while the fresh portfolio loads).
  variant: Variant
  // Rendered before the amount (e.g. the verification badge in the overview).
  badge?: React.ReactNode
  onPress?: () => void
  testID?: string
}

// Pure presentational balance: the total portfolio amount, its skeleton, and the
// cached-loading pulse. Reused by DashboardOverview (live) and DashboardShell (cached).
const DashboardBalance: React.FC<Props> = ({
  totalAmount,
  color,
  isPrivacyModeEnabled,
  variant,
  badge,
  onPress,
  testID
}) => {
  const { t } = useTranslation()

  if (variant === 'skeleton') {
    return (
      <SkeletonLoader
        lowOpacity
        width={BALANCE_SKELETON_WIDTH}
        height={BALANCE_HEIGHT}
        borderRadius={8}
      />
    )
  }

  const [integerPart, decimalPart] = formatDecimals(totalAmount, 'value').split('.')

  const amount = (
    <Pressable testID={testID} onPress={onPress} style={[flexbox.directionRow, flexbox.alignEnd]}>
      <Text
        fontSize={34}
        shouldScale={false}
        weight="number_bold"
        // Line height should be constant based on font size, not on parent height
        style={!isWeb ? { lineHeight: 36 } : { lineHeight: 28 }}
        color={color}
        testID="total-portfolio-amount-integer"
      >
        {privateValue(integerPart, isPrivacyModeEnabled, 7)}
      </Text>
      {totalAmount < THRESHOLD_AMOUNT_TO_HIDE_BALANCE_DECIMALS &&
        !isPrivacyModeEnabled &&
        typeof decimalPart === 'string' && (
          <Text
            fontSize={20}
            shouldScale={false}
            weight="number_bold"
            color={color}
            style={!isWeb ? { lineHeight: isiOS ? 30 : 28 } : { lineHeight: 20 }}
          >
            {t('.')}
            {decimalPart}
          </Text>
        )}
    </Pressable>
  )

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
      {badge}
      {variant === 'cached' ? <LoadingPulse>{amount}</LoadingPulse> : amount}
    </View>
  )
}

export default React.memo(DashboardBalance)
