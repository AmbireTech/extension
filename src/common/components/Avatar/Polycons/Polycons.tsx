import React, { memo } from 'react'
import { View } from 'react-native'
import Svg from 'react-native-svg'

import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

import { generateSeedEthereum, renderPolycon } from './utils'

interface PolyconProps {
  address: string
  size?: number
  isRound?: boolean
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
}

export const Polycons: React.FC<PolyconProps> = ({
  address,
  size = 32,
  isRound = true,
  borderRadius = BORDER_RADIUS_PRIMARY,
  borderWidth = 0,
  borderColor
}) => {
  const seed = generateSeedEthereum(address)

  return (
    <View
      style={
        // Wrapping view is required, otherwise, the border radius on Android doesn't work
        // {@link https://github.com/react-native-svg/react-native-svg/issues/1393}
        isRound && {
          borderRadius,
          overflow: 'hidden'
        }
      }
    >
      <Svg
        width={size}
        height={size}
        style={[{ borderWidth, borderColor }]}
        viewBox={`0 0 ${size} ${size}`}
      >
        {renderPolycon(seed, size)}
      </Svg>
    </View>
  )
}

export default memo(Polycons)
