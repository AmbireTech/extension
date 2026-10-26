import React from 'react'
import { View } from 'react-native'

import SummarySkeleton from '@common/modules/settings/components/TransactionHistory/SubmittedTransactionSummary/SummarySkeleton'
import spacings from '@common/styles/spacings'

const ActivityPositionsSkeleton = ({ amount = 5 }: { amount?: number }) => {
  // Needed so react keys are generated outside of the return statement
  const skeletonItems = Array.from({ length: amount }, (_, index) => {
    return { key: index }
  })

  // Laid out like the rows, which swap in one by one as each finishes loading
  return (
    <View>
      {skeletonItems.map((item) => (
        <SummarySkeleton key={item.key} style={spacings.mbSm} />
      ))}
    </View>
  )
}

export default React.memo(ActivityPositionsSkeleton)
