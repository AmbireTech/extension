import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import useTheme from '@common/hooks/useTheme'

import makeStyles from '../styles'

const Skeleton = () => {
  const { theme, themeType } = useTheme()
  const styles = makeStyles(theme, themeType)

  return (
    <View style={[styles.container, { marginHorizontal: 0 }]}>
      <SkeletonLoader width={300} height={32} borderRadius={14} />
      <SkeletonLoader width={200} height={32} />
    </View>
  )
}

export default React.memo(Skeleton)
