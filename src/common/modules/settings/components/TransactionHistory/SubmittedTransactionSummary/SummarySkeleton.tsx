import React from 'react'
import { View, ViewStyle } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

/**
 * The height of a loading activity row, close to that of a loaded one so the row swaps to
 * its final content without shifting the rows below it.
 */
export const SUMMARY_SKELETON_HEIGHT = 96

/**
 * A loading activity row. The card itself is drawn in the loaded row's color rather than
 * pulsing, so it stays visible on the page, and only the placeholders inside it pulse.
 */
const SummarySkeleton = ({ style }: { style?: ViewStyle }) => {
  const { styles } = useTheme(getStyles)

  return (
    <View
      style={[
        styles.container,
        spacings.phSm,
        spacings.pvSm,
        flexbox.justifySpaceBetween,
        { height: SUMMARY_SKELETON_HEIGHT },
        style
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, flexbox.alignCenter]}>
        <SkeletonLoader appearance="tertiaryBackground" width={72} height={20} borderRadius={10} />
        <SkeletonLoader appearance="tertiaryBackground" width={96} height={14} />
      </View>
      <SkeletonLoader appearance="tertiaryBackground" width="55%" height={18} />
    </View>
  )
}

export default React.memo(SummarySkeleton)
