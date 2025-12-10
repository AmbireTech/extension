import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import flexbox from '@common/styles/utils/flexbox'

import Background1 from './media/Background1'
import Background2 from './media/Background2'
import Background3 from './media/Background3'

const RewardsAndStats = () => {
  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
      <View
        style={{
          ...flexbox.justifyCenter,
          ...flexbox.alignCenter
        }}
      >
        <Background1 width={157} />
        <View style={{ position: 'absolute' }}>
          <Text>Total score</Text>
        </View>
      </View>
      <View
        style={{
          ...flexbox.justifyCenter,
          ...flexbox.alignCenter
        }}
      >
        <Background2 width={195} />
        <View style={{ position: 'absolute' }}>
          <Text>Estimated Rewards</Text>
        </View>
      </View>
      <View
        style={{
          ...flexbox.justifyCenter,
          ...flexbox.alignCenter
        }}
      >
        <Background3 width={152} />
        <View style={{ position: 'absolute' }}>
          <Text>Rank</Text>
        </View>
      </View>
    </View>
  )
}

export default RewardsAndStats
