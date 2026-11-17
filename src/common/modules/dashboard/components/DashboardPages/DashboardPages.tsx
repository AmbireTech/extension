import { nanoid } from 'nanoid'
import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import DashboardPagesCarousel from '@common/modules/dashboard/components/DashboardPagesCarousel'

import Activity from '../Activity'
import Collections from '../Collections'
import DeFiPositions from '../DeFiPositions'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import Tokens from '../Tokens'
import SessionIdInUrl from './SessionIdInUrl'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import type { DashboardPagesCarouselProps } from '@common/modules/dashboard/components/DashboardPagesCarousel/DashboardPagesCarousel'

interface Props {
  refreshing?: boolean
  onRefresh?: () => void
  /** How far the open overview pushes the pages down. They slide over its collapsing part. */
  overviewHeight?: number
  /** See `DashboardPagesCarouselProps['onOverviewCollapseChange']` */
  onOverviewCollapseChange?: DashboardPagesCarouselProps['onOverviewCollapseChange']
}

const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter
const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

const DashboardPages = ({
  refreshing,
  onRefresh,
  overviewHeight,
  onOverviewCollapseChange
}: Props) => {
  const { t } = useTranslation()
  const route = useRoute()
  const [sessionId] = useState(`dashboard-${nanoid()}`)
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )

  const { state: networks } = useController('NetworksController', selectNetworks)

  const [openTab, setOpenTab] = useState(() => {
    const params = new URLSearchParams(route?.search)

    return (params.get('tab') as TabType) || 'tokens'
  })
  const prevOpenTab = usePrevious(openTab)
  // The tabs row reads the open tab directly, the pages read it one render behind, so
  // pressing a tab or swiping to it repaints the row without waiting for four lists
  // to reconcile first.
  const pagesOpenTab = useDeferredValue(openTab)
  // To prevent initial load of all tabs but load them when requested by the user
  // Persist the rendered list of items for each tab once opened
  // This technique improves the initial loading speed of the dashboard
  const [initTab, setInitTab] = useState<{
    [key: string]: boolean
  }>({})

  // The carousel keeps all pages mounted side by side, so they must be
  // populated upfront instead of when the tab is opened.
  const initAllTabs = useCallback(() => {
    setInitTab((prev) =>
      prev.tokens && prev.collectibles && prev.defi && prev.activity
        ? prev
        : { tokens: true, collectibles: true, defi: true, activity: true }
    )
  }, [])

  const network = useMemo(() => {
    if (!dashboardNetworkFilter || dashboardNetworkFilter === 'rewards') return null

    const result = networks.find(({ chainId }) => chainId === BigInt(dashboardNetworkFilter))

    return result || null
  }, [dashboardNetworkFilter, networks])

  const dashboardNetworkFilterName = useMemo(() => {
    if (!dashboardNetworkFilter) return null

    if (dashboardNetworkFilter === 'rewards') return t('Rewards')

    const result = networks.find(({ chainId }) => chainId === BigInt(dashboardNetworkFilter))

    return result?.name || null
  }, [dashboardNetworkFilter, networks, t])

  useEffect(() => {
    if (openTab !== prevOpenTab && !initTab?.[openTab]) {
      setInitTab((prev) => ({ ...prev, [openTab]: true }))
    }
  }, [openTab, prevOpenTab, initTab])

  return (
    <>
      <SessionIdInUrl sessionId={sessionId} />
      <DashboardPagesCarousel
        openTab={openTab}
        setOpenTab={setOpenTab}
        sessionId={sessionId}
        initAllTabs={initAllTabs}
        onRefresh={onRefresh}
        refreshing={refreshing}
        overviewHeight={overviewHeight}
        onOverviewCollapseChange={onOverviewCollapseChange}
      >
        {/* Every page stays mounted, because the carousel maps a page index to a tab and
        an unmounted page would shift the ones after it */}
        <Tokens
          openTab={pagesOpenTab}
          initTab={initTab}
          dashboardNetworkFilterName={dashboardNetworkFilterName}
        />
        <DeFiPositions
          openTab={pagesOpenTab}
          initTab={initTab}
          sessionId={sessionId}
          dashboardNetworkFilterName={dashboardNetworkFilterName}
        />
        <Collections
          openTab={pagesOpenTab}
          initTab={initTab}
          networks={networks}
          dashboardNetworkFilterName={dashboardNetworkFilterName}
        />
        <Activity
          openTab={pagesOpenTab}
          sessionId={sessionId}
          initTab={initTab}
          network={network}
        />
      </DashboardPagesCarousel>
    </>
  )
}

export default React.memo(DashboardPages)
