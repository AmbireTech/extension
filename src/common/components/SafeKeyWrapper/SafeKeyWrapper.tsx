import React from 'react'
import { ColorValue, View, ViewProps } from 'react-native'

import CheckIcon2 from '@common/assets/svg/CheckIcon2'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { default as flexbox } from '@common/styles/utils/flexbox'

interface Props {
  children?: any
  style?: ViewProps['style']
  checkedColor?: ColorValue
  isDisabled?: boolean
  hasSigned?: boolean
}

const SafeKeyWrapper = ({ children, style, checkedColor, isDisabled, hasSigned }: Props) => {
  const { theme } = useTheme()

  return (
    <View
      style={[style, flexbox.directionRow, flexbox.alignCenter, isDisabled && { opacity: 0.6 }]}
    >
      {!isDisabled && (
        <CheckIcon2
          color={hasSigned ? theme.success400 : theme.secondaryText}
          checkColor={checkedColor || theme.neutral100}
          style={spacings.mrTy}
        />
      )}
      <View style={flexbox.flex1}>{children}</View>
    </View>
  )
}

export default React.memo(SafeKeyWrapper)
