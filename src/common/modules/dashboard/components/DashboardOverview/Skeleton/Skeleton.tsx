import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import spacings from '@common/styles/spacings'

const Skeleton = () => {
  return (
    <View style={[spacings.phSm, spacings.ptSm, spacings.mbMi]}>
      <SkeletonLoader width="100%" height={226} />
    </View>
  )
}

export default React.memo(Skeleton)
