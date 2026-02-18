import React, { FC } from 'react'
import { View } from 'react-native'

import { GlassViewProps } from './types'

const GlassView: FC<GlassViewProps> = ({ children }) => {
  return <View>{children}</View>
}

export default GlassView
