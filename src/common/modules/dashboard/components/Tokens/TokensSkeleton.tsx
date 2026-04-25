import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'

const TokensSkeleton = ({ amount = isMobile ? 20 : 5 }: { amount?: number }) => {
  // Needed so react keys are generated outside of the return statement
  const skeletonItems = Array.from({ length: amount }, (_, index) => {
    return {
      key: index
    }
  })

  return (
    <View style={[spacings.ptMi]}>
      {skeletonItems.map((item) => (
        <SkeletonLoader
          key={item.key}
          width="100%"
          height={isMobile ? 52 : 40}
          style={isMobile ? spacings.mvMi : spacings.mb}
        />
      ))}
    </View>
  )
}

export default React.memo(TokensSkeleton)
