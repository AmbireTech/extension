import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'

import PlainAddress from './PlainAddress'

interface Props {
  maxLength: number
  address: string
  style?: ViewStyle
  hideParentheses?: boolean
  fontSize?: number
}

const PlainAddressWithCopy: FC<Props> = ({
  maxLength,
  address,
  style,
  hideParentheses,
  fontSize = 12
}) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useHover({
    preset: 'opacityInverted'
  })

  const handleCopy = async () => {
    try {
      await setStringAsync(address)
      addToast(t('Address copied to clipboard'))
    } catch {
      addToast(t('Failed to copy address'))
    }
  }

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
      <PlainAddress
        maxLength={maxLength}
        address={address}
        hideParentheses={hideParentheses}
        style={style}
        fontSize={fontSize}
      />
      <AnimatedPressable onPress={handleCopy} style={animStyle} {...bindAnim}>
        <CopyIcon width={fontSize + 2} height={fontSize + 2} color={theme.secondaryText} />
      </AnimatedPressable>
    </View>
  )
}

export default PlainAddressWithCopy
