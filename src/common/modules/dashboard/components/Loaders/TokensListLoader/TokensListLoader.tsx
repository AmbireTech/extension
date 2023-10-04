import React from 'react'
import SkeletonPlaceholder from 'react-native-skeleton-placeholder'

import colors from '@common/styles/colors'
import { SPACING, SPACING_MI, SPACING_SM } from '@common/styles/spacings'

const TokensListLoader = () => {
  const LoaderItem = (
    <SkeletonPlaceholder.Item
      flexDirection="row"
      paddingHorizontal={SPACING_SM}
      paddingVertical={SPACING}
      backgroundColor={colors.chetwode_50}
      borderRadius={13}
      height={70}
    >
      <SkeletonPlaceholder.Item width={34} height={34} borderRadius={13} marginRight={15} />
      <SkeletonPlaceholder.Item flex={1} justifyContent="center">
        <SkeletonPlaceholder.Item
          width="100%"
          height={10}
          borderRadius={4}
          marginBottom={SPACING_MI}
        />
        <SkeletonPlaceholder.Item width={40} height={10} borderRadius={4} alignSelf="flex-end" />
      </SkeletonPlaceholder.Item>
      <SkeletonPlaceholder.Item width={34} height={34} borderRadius={13} marginLeft={15} />
    </SkeletonPlaceholder.Item>
  )

  return (
    <SkeletonPlaceholder
      backgroundColor={colors.chetwode}
      highlightColor={colors.baileyBells}
      speed={1600}
    >
      {LoaderItem}
      {LoaderItem}
      {LoaderItem}
      {LoaderItem}
      {LoaderItem}
    </SkeletonPlaceholder>
  )
}

export default TokensListLoader
