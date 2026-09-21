import React, { ReactNode } from 'react'
import { View, ViewStyle } from 'react-native'

interface Props {
  style: ViewStyle
  /** Pages are rendered one at a time, but their slot has to be there from the start. */
  rendered: boolean
  children: ReactNode
}

const CarouselPage = ({ style, rendered, children }: Props) => (
  <View style={style}>{rendered ? children : null}</View>
)

export default CarouselPage
