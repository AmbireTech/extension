import React from 'react'
import { View, ViewStyle } from 'react-native'

import logo from '@web/assets/svg/ambire-white-small-logo.svg'

type Props = {
  style?: ViewStyle
}

const AmbireSmallWhiteLogo: React.FC<Props> = ({ style }) => {
  return (
    <View style={style}>
      <img src={logo} style={{ width: 92.4, height: 33.1 }} alt="Ambire Logo" />
    </View>
  )
}

export default AmbireSmallWhiteLogo
