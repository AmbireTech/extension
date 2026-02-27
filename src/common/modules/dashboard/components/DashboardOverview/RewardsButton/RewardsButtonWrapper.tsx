import React from 'react'
import { Pressable } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const RewardsButtonWrapper = ({
  children,
  onPress
}: {
  children: React.ReactNode
  onPress: () => void
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={{
        ...flexbox.directionRow,
        ...flexbox.center,
        ...spacings.phSm,
        borderColor: '#FFFFFF1F',
        borderRadius: 12,
        borderWidth: 1,
        backgroundColor: '#000000',
        height: 26
      }}
    >
      {children}
    </Pressable>
  )
}

export default RewardsButtonWrapper
