import React from 'react'
import { ColorValue, View } from 'react-native'
import { SvgProps } from 'react-native-svg'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'

const PendingBadge = ({
  amount,
  amountFormatted,
  label,
  Icon,
  backgroundColor,
  textColor,
  borderColor = 'transparent'
}: {
  amount: bigint
  amountFormatted: string
  label: string
  Icon: React.ComponentType<SvgProps>
  backgroundColor: ColorValue
  textColor: ColorValue
  borderColor?: ColorValue
}) => {
  const { t } = useTranslation()

  return (
    <View
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
          borderWidth: 1
        }
      ]}
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
    </View>
  )
}

export default React.memo(PendingBadge)
