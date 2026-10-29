import React from 'react'

import { BUTTON_HEIGHT } from '@common/components/Button'
import SkeletonLoader from '@common/components/SkeletonLoader'
import spacings from '@common/styles/spacings'

const SKELETONS_TO_DISPLAY = 2

const Skeletons = () => {
  const skeletonItems = Array.from({ length: SKELETONS_TO_DISPLAY }, (_, index) => {
    return {
      key: index
    }
  })
  return (
    <div>
      {skeletonItems.map(({ key }) => (
        <SkeletonLoader
          key={key}
          height={BUTTON_HEIGHT}
          style={spacings.mbTy}
          width="100%"
          appearance="secondaryBackground"
        />
      ))}
    </div>
  )
}

export default Skeletons
