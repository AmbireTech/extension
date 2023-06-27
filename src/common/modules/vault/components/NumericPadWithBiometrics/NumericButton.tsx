import React from 'react'
import { TouchableHighlight } from 'react-native'

import Text from '@common/components/Text'
import colors from '@common/styles/colors'
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
    <TouchableHighlight
      disabled={isDisabled}
      onPress={handleOnPress}
      underlayColor={colors.chetwode}
      style={[styles.numericButton, isDisabled && { opacity: 0.3 }]}
    >
      <Text weight="semiBold" fontSize={20} style={text.center}>
        {digit.toString()}
      </Text>
    </TouchableHighlight>
  )
}

export default React.memo(NumericButton)
