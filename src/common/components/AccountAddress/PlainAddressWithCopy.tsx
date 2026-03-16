import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import { isMobile, isWeb } from '@common/config/env'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'

import PlainAddress from './PlainAddress'

interface Props {
  maxLength: number
  address: string
  style?: ViewStyle
  hideParentheses?: boolean
  fontSize?: number
  children?: React.ReactNode
  withWrap?: boolean
}

const PlainAddressWithCopy: FC<Props> = ({
  maxLength,
  address,
  style,
  hideParentheses,
  fontSize = 12,
  children,
  withWrap = false
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
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        withWrap ? { flexBasis: 110, flexGrow: 1, flexShrink: 1 } : {}
      ]}
    >
      <PlainAddress
        maxLength={maxLength}
        address={address}
        hideParentheses={hideParentheses}
        style={{
          ...style,
          ...(maxLength === 42 ? { flexShrink: 1 } : {}),
          ...(isWeb ? { flexShrink: 0 } : {}),
          ...(withWrap ? { minWidth: isMobile ? 70 : 170 } : {})
        }}
        fontSize={fontSize}
      />
      <AnimatedPressable onPress={handleCopy} style={animStyle} {...bindAnim}>
        <CopyIcon width={fontSize + 8} height={fontSize + 8} color={theme.secondaryText} />
      </AnimatedPressable>
      {children}
    </View>
  )
}

export default PlainAddressWithCopy
