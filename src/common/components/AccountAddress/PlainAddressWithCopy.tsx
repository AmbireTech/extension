import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon/ReceiveIcon'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { setStringAsync } from '@common/utils/clipboard'

import PlainAddress from './PlainAddress'

interface Props {
  maxLength: number
  address: string
  style?: ViewStyle
  hideParentheses?: boolean
  fontSize?: number
  withReceive?: boolean
}

const PlainAddressWithCopy: FC<Props> = ({
  maxLength,
  address,
  style,
  hideParentheses,
  fontSize = 12,
  withReceive = false
}) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useHover({
    preset: 'opacityInverted'
  })
  const { navigate } = useNavigation()

  const handleCopy = async () => {
    try {
      await setStringAsync(address)
      addToast(t('Address copied to clipboard'))
    } catch {
      addToast(t('Failed to copy address'))
    }
  }

  const handleReceive = async () => {
    await navigate(WEB_ROUTES.receive, { state: { address: address } })
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
        <CopyIcon width={fontSize + 8} height={fontSize + 8} color={theme.secondaryText} />
      </AnimatedPressable>
      {withReceive && (
        <AnimatedPressable onPress={handleReceive} style={animStyle} {...bindAnim}>
          <ReceiveIcon
            width={fontSize + 8}
            height={fontSize + 8}
            style={spacings.mlMi}
            color={theme.secondaryText}
          />
        </AnimatedPressable>
      )}
    </View>
  )
}

export default PlainAddressWithCopy
