import React from 'react'
import { TouchableOpacity } from 'react-native'

import Text from '@common/components/Text'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import text from '@common/styles/utils/text'

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
      onPress={handleOnPress}
      style={[
        spacings.mhTy,
        spacings.mvTy,
        spacings.pvTy,
        {
          backgroundColor: colors.chetwode_50,
          width: '30%',
          maxWidth: 100,
          borderRadius: BORDER_RADIUS_PRIMARY
        }
      ]}
    >
      <Text weight="semiBold" fontSize={20} style={text.center}>
        {digit.toString()}
      </Text>
    </TouchableOpacity>
  )
}

export default React.memo(NumericButton)
