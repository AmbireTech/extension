import React from 'react'
import { View } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'
import { isMobile } from '@common/config/env'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'

type Props = {
  appearance?: keyof ThemeProps
}

const EstimationSkeleton = ({ appearance }: Props) => {
  return (
    <View style={[isMobile && spacings.ptSm]}>
      <SkeletonLoader appearance={appearance} width="100%" height={108} style={spacings.mbMi} />
    </View>
  )
}

export default EstimationSkeleton
