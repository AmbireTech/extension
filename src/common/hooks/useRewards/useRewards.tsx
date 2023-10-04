import { useContext } from 'react'

import { RewardsContext, RewardsContextReturnType } from '@common/contexts/rewardsContext'

export default function useRewards(): RewardsContextReturnType {
  const context = useContext(RewardsContext)

  if (!context) {
    throw new Error('useRewards must be used within an RewardsProvider')
  }

  return context
}
