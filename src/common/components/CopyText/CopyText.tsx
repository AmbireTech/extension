import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ColorValue, TouchableOpacityProps } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import NavIconWrapper from '@common/components/NavIconWrapper'
import useToast from '@common/hooks/useToast'
import colors from '@common/styles/colors'

interface Props {
  text: string
  style?: TouchableOpacityProps['style']
  iconColor?: ColorValue
  iconWidth?: number
  iconHeight?: number
}

const CopyText: React.FC<Props> = ({ text, style, iconColor = colors.violet, iconWidth = 15, iconHeight = 15 }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const handleCopyText = () => {
    Clipboard.setStringAsync(text)
    addToast(t('Copied to clipboard!') as string, { timeout: 2500 })
  }

  return (
    <NavIconWrapper onPress={handleCopyText} style={style} hoverBackground="transparent">
      <CopyIcon color={iconColor} width={iconWidth} height={iconHeight} />
    </NavIconWrapper>
  )
}

export default CopyText
