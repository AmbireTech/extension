import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

const DappsSkeletonLoader = () => {
  return (
    <View style={[flexbox.flex1, spacings.phSm, spacings.pvSm]}>
      <SkeletonLoader width="100%" height={36} style={spacings.mbTy} />
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          flexbox.justifySpaceBetween,
          spacings.mb
        ]}
      >
        <SkeletonLoader width="27%" height={32} />
        <SkeletonLoader width="32%" height={32} />
        <SkeletonLoader width="15%" height={32} />
        <SkeletonLoader width="18%" height={32} />
      </View>
      <SkeletonLoader width="100%" height={75} style={spacings.mbTy} />
      <SkeletonLoader width="100%" height={75} style={spacings.mbTy} />
      <SkeletonLoader width="100%" height={75} style={spacings.mbTy} />
      <SkeletonLoader width="100%" height={75} style={spacings.mbTy} />
      <SkeletonLoader width="100%" height={75} style={spacings.mbTy} />
    </View>
  )
}

export default React.memo(DappsSkeletonLoader)
