import React from 'react'
import { ColorValue } from 'react-native'
import { SvgProps } from 'react-native-svg'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

const PendingBadge = ({
  amount,
  amountFormatted,
  label,
  Icon,
  backgroundColor,
  textColor,
  borderColor = 'transparent',
  hoverBorderColor,
  onPress
}: {
  amount: bigint
  amountFormatted: string
  label: string
  Icon: React.ComponentType<SvgProps>
  backgroundColor: ColorValue
  textColor: ColorValue
  borderColor?: ColorValue
  hoverBorderColor?: ColorValue
  onPress?: () => void
}) => {
  const { t } = useTranslation()
  const isInteractive = !!onPress

  const fromBorder = String(borderColor)
  const toBorder = String(isInteractive ? hoverBorderColor ?? borderColor : borderColor)

  const [bindAnim, animStyle] = useCustomHover({
    property: 'borderColor',
    values: { from: fromBorder, to: toBorder }
  })

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!isInteractive}
      style={[
        spacings.pvMi,
        spacings.plSm,
        spacings.prTy,
        spacings.mbMi,
        flexboxStyles.alignSelfStart,
        flexboxStyles.alignCenter,
        flexboxStyles.directionRow,
        {
          borderRadius: 64,
          height: 32,
          backgroundColor,
          borderColor,
          borderWidth: 1,
          // @ts-ignore react-native-web supports `cursor`
          cursor: isInteractive ? 'pointer' : 'auto'
        },
        animStyle
      ]}
      {...(isInteractive ? bindAnim : {})}
    >
      <Text
        selectable
        color={textColor}
        weight="medium"
        fontSize={12}
        numberOfLines={1}
        style={spacings.mrMi}
      >
        {t(`${amount > 0n ? '+' : ''}${amountFormatted} ${label}`)}
      </Text>
      <Icon color={textColor} width={20} height={20} />
    </AnimatedPressable>
  )
}

export default React.memo(PendingBadge)
