import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import { isWeb } from '@common/config/env'

import makeStyles from '../styles'

const Skeleton = () => {
  const styles = makeStyles()

  return (
    <View style={[styles.container, { marginHorizontal: 0 }]}>
      <SkeletonLoader width={isWeb ? 300 : '100%'} height={32} borderRadius={14} />
    </View>
  )
}

export default React.memo(Skeleton)
