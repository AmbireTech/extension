import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import { isMobile, isWeb } from '@common/config/env'
import spacings from '@common/styles/spacings'

const Skeleton = () => {
  return (
    <View style={[spacings.phSm, isWeb && spacings.ptSm, spacings.mbMi]}>
      <SkeletonLoader width="100%" height={isMobile ? 222 : 226} />
    </View>
  )
}

export default React.memo(Skeleton)
