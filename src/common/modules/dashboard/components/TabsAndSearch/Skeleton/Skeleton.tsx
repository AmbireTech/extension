import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import useTheme from '@common/hooks/useTheme'
import { getUiType } from '@web/utils/uiType'

import makeStyles from '../styles'

const { isTab } = getUiType()

const Skeleton = () => {
  const { theme, themeType } = useTheme()
  const styles = makeStyles(theme, themeType)

  return (
    <View style={[styles.container, { marginHorizontal: 0 }]}>
      <SkeletonLoader width={isTab ? 350 : 300} height={32} borderRadius={14} />
      <SkeletonLoader width={200} height={32} />
    </View>
  )
}

export default React.memo(Skeleton)
