import React, { createContext, useMemo } from 'react'

import useStorage from '@common/hooks/useStorage'

interface RewardsContextReturnProps {
  promoBannerIdsRead: string[]
  setPromoBannerIdsRead: (item: string[] | null) => void
}

const RewardsContext = createContext<RewardsContextReturnProps>({
  promoBannerIdsRead: [],
  setPromoBannerIdsRead: () => {}
})

const RewardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [promoBannerIdsRead, setPromoBannerIdsRead] = useStorage<string[]>({
    key: 'promoBannerIdsRead',
    defaultValue: []
  })

  return (
    <RewardsContext.Provider
      value={useMemo(
        () => ({
          promoBannerIdsRead: promoBannerIdsRead || [],
          setPromoBannerIdsRead
        }),
        [promoBannerIdsRead, setPromoBannerIdsRead]
      )}
    >
      {children}
    </RewardsContext.Provider>
  )
}

export { RewardsContext, RewardsProvider }
