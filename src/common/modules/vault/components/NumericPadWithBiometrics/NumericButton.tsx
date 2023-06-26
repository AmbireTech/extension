import React from 'react'
import { TouchableOpacity } from 'react-native'

import Text from '@common/components/Text'
import text from '@common/styles/utils/text'

import styles from './style'

interface Props {
  isDisabled: boolean
  onPress: (digit: number) => void
  digit: number
}

const NumericButton: React.FC<Props> = ({ isDisabled, onPress, digit }) => {
  const handleOnPress = () => onPress(digit)

  return (
    <TouchableOpacity
      disabled={isDisabled}
      activeOpacity={0.8}
      onPress={handleOnPress}
      style={[styles.numericButton, isDisabled && { opacity: 0.3 }]}
    >
      <Text weight="semiBold" fontSize={20} style={text.center}>
        {digit.toString()}
      </Text>
    </TouchableOpacity>
  )
}

export default React.memo(NumericButton)
