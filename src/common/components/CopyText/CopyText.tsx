import React from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, ViewStyle } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import useHover, { AnimatedPressable } from '@common/hooks/useHover'
import useToast from '@common/hooks/useToast'
import { setStringAsync } from '@common/utils/clipboard'

interface Props {
  text: string
  style?: ViewStyle
  iconColor?: ColorValue
  iconSize?: number
}

const CopyText: React.FC<Props> = ({ text, style, iconColor, iconSize = 20 }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const [bindAnim, animStyle] = useHover({
    preset: 'opacityInverted'
  })

  const handleCopyText = () => {
    setStringAsync(text)
    addToast(t('Copied to clipboard!') as string, { timeout: 2500 })
  }

  return (
    <AnimatedPressable onPress={handleCopyText} style={[style, animStyle]} {...bindAnim}>
      <CopyIcon color={iconColor} width={iconSize} height={iconSize} />
    </AnimatedPressable>
  )
}

export default CopyText
