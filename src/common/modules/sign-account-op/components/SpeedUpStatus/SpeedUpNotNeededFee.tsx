import React, { memo, ReactNode } from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import textStyles from '@common/styles/utils/text'

type Props = {
  /** The transaction being sped up was already processed, so the fee no longer applies */
  isSpeedUpNotNeeded: boolean
  /** The pending transaction was being canceled rather than sped up */
  isCancel?: boolean
  children: ReactNode
}

/**
 * Wraps the fee of the sign screen. Once a speed up is no longer needed, it dims the fee,
 * stops it from being changed and explains why. The wrapper stays mounted either way,
 * so the fee keeps its state when this changes
 */
const SpeedUpNotNeededFee = ({ isSpeedUpNotNeeded, isCancel, children }: Props) => {
  const { t } = useTranslation()

  return (
    <View>
      <View style={isSpeedUpNotNeeded && { opacity: 0.45, pointerEvents: 'none' }}>{children}</View>
      {isSpeedUpNotNeeded && (
        <Text
          testID="speed-up-not-needed-notice"
          fontSize={12}
          appearance="secondaryText"
          style={[spacings.mtSm, textStyles.center]}
        >
          {isCancel
            ? t(
                'Your original transaction has already been processed, so it can no longer be canceled.'
              )
            : t(
                "Your original transaction has already been processed, so there's nothing to speed up."
              )}
        </Text>
      )}
    </View>
  )
}

export default memo(SpeedUpNotNeededFee)
