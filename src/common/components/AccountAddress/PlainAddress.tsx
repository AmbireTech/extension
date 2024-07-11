import * as Clipboard from 'expo-clipboard'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

import shortenAddress from '@ambire-common/utils/shortenAddress'
import CopyIcon from '@common/assets/svg/CopyIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useHover, { AnimatedPressable } from '@web/hooks/useHover'

interface Props {
  maxLength: number
  address: string
  style?: any
  hideParentheses?: boolean
}

const PlainAddress: FC<Props> = ({ maxLength, address, style, hideParentheses }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { theme } = useTheme()
  const [bindAnim, animStyle] = useHover({
    preset: 'opacityInverted'
  })

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(address)
      addToast(t('Address copied to clipboard'))
    } catch {
      addToast(t('Failed to copy address'))
    }
  }

  return (
    <AnimatedPressable
      onPress={handleCopy}
      style={[flexbox.directionRow, flexbox.alignCenter, animStyle]}
      {...bindAnim}
    >
      <Text fontSize={12} appearance="secondaryText" style={[spacings.mrMi, style]}>
        {hideParentheses ? '' : '('}
        {shortenAddress(address, maxLength)}
        {hideParentheses ? '' : ')'}
      </Text>
      <CopyIcon width={14} height={14} color={theme.secondaryText} />
    </AnimatedPressable>
  )
}

export default PlainAddress
