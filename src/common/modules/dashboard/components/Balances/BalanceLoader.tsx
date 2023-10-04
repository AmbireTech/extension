import React from 'react'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'

import colors from '@common/styles/colors'

const BalanceLoader = () => {
  return (
    <SkeletonPlaceholder
      backgroundColor={colors.chetwode}
      highlightColor={colors.baileyBells}
      speed={1600}
    >
      <SkeletonPlaceholder.Item
        marginTop={20}
        marginBottom={30}
        alignSelf="center"
        width={180}
        height={45}
        borderRadius={13}
      />
    </SkeletonPlaceholder>
  )
}

export default BalanceLoader
