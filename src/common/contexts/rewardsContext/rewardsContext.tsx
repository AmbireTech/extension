import useRewards from 'ambire-common/src/hooks/useRewards'
import { UseRewardsReturnType } from 'ambire-common/src/hooks/useRewards/types'
import React, { createContext, useMemo } from 'react'

import CONFIG from '@common/config/env'
import useAccounts from '@common/hooks/useAccounts'
import useRelayerData from '@common/hooks/useRelayerData'
import useStorage from '@common/hooks/useStorage'
import getRewardsSource from '@common/modules/dashboard/helpers/getRewardsSource'

export interface RewardsContextReturnType extends UseRewardsReturnType {
  promoBannerIdsRead: string[]
  setPromoBannerIdsRead: (item: string[] | null) => void
}

const RewardsContext = createContext<RewardsContextReturnType>({} as RewardsContextReturnType)

const source = getRewardsSource()

const RewardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedAcc } = useAccounts()
  const [promoBannerIdsRead, setPromoBannerIdsRead] = useStorage<string[]>({
    key: 'promoBannerIdsRead',
    defaultValue: []
  })

  const rewards = useRewards({
    relayerURL: CONFIG.RELAYER_URL,
    accountId: selectedAcc,
    useRelayerData,
    source
  })

  return (
    <RewardsContext.Provider
      value={useMemo(
        () => ({
          promoBannerIdsRead: promoBannerIdsRead || [],
          setPromoBannerIdsRead,
          ...rewards
        }),
        [promoBannerIdsRead, setPromoBannerIdsRead, rewards]
      )}
    >
      {children}
    </RewardsContext.Provider>
  )
}

export { RewardsContext, RewardsProvider }
