import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Dapp } from '@ambire-common/interfaces/dapp'
import ConnectedIcon from '@common/assets/svg/ConnectedIcon'
import ExploreIcon from '@common/assets/svg/ExploreIcon'
import RecentIcon from '@common/assets/svg/RecentIcon'
import StarIcon from '@common/assets/svg/StarIcon'
import useController from '@common/hooks/useController'

export type ExploreSectionType = 'recent' | 'connected' | 'favorites' | 'apps'

export type ExploreSection = {
  type: ExploreSectionType
  title: string
  icon: React.ReactNode
  data: Dapp[]
  showTrash: boolean
}

const ICON_SIZE = 20

/**
 * Builds the sections shown on the main Explore screen.
 * Recent/Connected/Favorites sections are hidden when empty; "Explore apps" is always present.
 * "apps" surfaces only featured dapps on the main screen — the sub-screen shows the full catalog.
 */
const useExploreSections = (): ExploreSection[] => {
  const { t } = useTranslation()
  const { state } = useController('DappsController')

  const recent: Dapp[] = useMemo(() => state.recentDapps || [], [state.recentDapps])
  const connected: Dapp[] = useMemo(
    () => (state.dapps || []).filter((d: Dapp) => !!d.isConnected),
    [state.dapps]
  )
  const favorites: Dapp[] = useMemo(
    () => (state.dapps || []).filter((d: Dapp) => !!d.favorite),
    [state.dapps]
  )
  const featured: Dapp[] = useMemo(
    () => (state.dapps || []).filter((d: Dapp) => !!d.isFeatured),
    [state.dapps]
  )

  return useMemo(() => {
    const all: ExploreSection[] = [
      {
        type: 'recent',
        title: t('Recent'),
        icon: <RecentIcon width={ICON_SIZE + 2} height={ICON_SIZE} />,
        data: recent,
        showTrash: true
      },
      {
        type: 'connected',
        title: t('Connected'),
        icon: <ConnectedIcon width={ICON_SIZE + 2} height={ICON_SIZE} />,
        data: connected,
        showTrash: false
      },
      {
        type: 'favorites',
        title: t('Favorites'),
        icon: <StarIcon width={ICON_SIZE + 2} height={ICON_SIZE} />,
        data: favorites,
        showTrash: false
      },
      {
        type: 'apps',
        title: t('Explore apps'),
        icon: <ExploreIcon width={ICON_SIZE} height={ICON_SIZE} strokeWidth="1.3" />,
        data: featured,
        showTrash: false
      }
    ]
    return all.filter((s) => s.type === 'apps' || s.data.length > 0)
  }, [t, recent, connected, favorites, featured])
}

export default useExploreSections
