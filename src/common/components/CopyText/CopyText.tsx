import * as Clipboard from 'expo-clipboard'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacityProps } from 'react-native'

import CopyIcon from '@common/assets/svg/CopyIcon'
import NavIconWrapper from '@common/components/NavIconWrapper'
import useToast from '@common/hooks/useToast'

interface Props {
  text: string
  style?: TouchableOpacityProps['style']
  width?: number
  height?: number
}

const CopyText: React.FC<Props> = ({ text, style, width, height }) => {
  const { t } = useTranslation()
  const { addToast } = useToast()

  const handleCopyText = () => {
    Clipboard.setStringAsync(text)
    addToast(t('Copied to clipboard!') as string, { timeout: 2500 })
  }

  return (
    <NavIconWrapper onPress={handleCopyText} style={style}>
      <CopyIcon {...(width ? { width } : {})} {...(height ? { height } : {})} />
    </NavIconWrapper>
  )
}

export default CopyText
