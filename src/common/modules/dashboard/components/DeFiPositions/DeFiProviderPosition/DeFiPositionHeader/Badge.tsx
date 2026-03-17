import React from 'react'
import { View, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const Badge = ({
  text,
  type,
  style
}: {
  text: string
  type: 'success' | 'info' | 'error' | 'warning'
  style?: ViewStyle
}) => {
  const { theme } = useTheme()
  return (
    <View
      style={
        isMobile
          ? {}
          : {
              ...spacings.phTy,
              ...spacings.mrTy,
              ...flexbox.justifyCenter,
              height: 28,
              borderRadius: BORDER_RADIUS_PRIMARY,
              backgroundColor: `${String(theme[`${type}Decorative`])}14`,
              ...style
            }
      }
    >
      <Text fontSize={isMobile ? 10 : 12} weight="medium" appearance={`${type}Text`}>
        {text}
      </Text>
    </View>
  )
}

export default React.memo(Badge)
