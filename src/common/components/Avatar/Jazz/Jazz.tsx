import React from 'react'
import { View } from 'react-native'
import { SvgXml } from 'react-native-svg'

import Jazzicon from '@raugfer/jazzicon'

// sample code for react component
export default function JazzIcon({
  address,
  size,
  borderRadius
}: {
  address: string
  size: number
  borderRadius: number
}) {
  const svgString = Jazzicon(address)
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        overflow: 'hidden'
      }}
    >
      <SvgXml xml={svgString} width={size} height={size} />
    </View>
  )
}
