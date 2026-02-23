import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'

import makeStyles from '../styles'

const Skeleton = () => {
  const styles = makeStyles()

  return (
    <View style={[styles.container, { marginHorizontal: 0 }]}>
      <SkeletonLoader width={300} height={32} borderRadius={14} />
      <SkeletonLoader width={200} height={32} />
    </View>
  )
}

export default React.memo(Skeleton)
