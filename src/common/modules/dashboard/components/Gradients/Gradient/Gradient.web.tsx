import './gradient.css'

import React from 'react'
import { View, ViewStyle } from 'react-native'

const Gradient = ({ style = {} }: { style?: ViewStyle }) => {
  return <View nativeID="gradient" style={style} />
}

export default Gradient
