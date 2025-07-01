import React from 'react'
import { View } from 'react-native'

import Badge from '@common/components/Badge'
import spacings from '@common/styles/spacings'

const Wrapper = ({ text, children }: { text: string; children: React.ReactNode }) => {
  return (
    <Badge text={text}>
      <View style={spacings.mlMi}>{children}</View>
    </Badge>
  )
}

export default React.memo(Wrapper)
