import { nanoid } from 'nanoid'
import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { useSearchParams } from 'react-router-dom'

import { isMobile } from '@common/config/env'
import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import DashboardPagesCarousel from '@common/modules/dashboard/components/DashboardPagesCarousel'

import Activity from '../Activity'
import Collections from '../Collections'
import DeFiPositions from '../DeFiPositions'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import Tokens from '../Tokens'

interface Props {
  /** Only web collapses the overview and hides the search on scroll. */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  animatedOverviewHeight: Animated.Value
  isSearchHidden?: boolean
  refreshing?: boolean
  onRefresh?: () => void
}

const DashboardPages = ({
  onScroll,
  isSearchHidden,
  animatedOverviewHeight,
  refreshing,
  onRefresh
}: Props) => {
  const { t } = useTranslation()
  const route = useRoute()
  const [sessionId] = useState(`dashboard-${nanoid()}`)
  const [, setSearchParams] = useSearchParams()
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    'dashboardNetworkFilter'
  )

  const { state: networks } = useController('NetworksController', 'networks')

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

  // The mobile carousel keeps all pages mounted side by side, so they must be
  // populated upfront instead of when the tab is opened.
  const initAllTabs = useCallback(() => {
    setInitTab((prev) =>
      prev.tokens && prev.collectibles && prev.defi && prev.activity
        ? prev
        : { tokens: true, collectibles: true, defi: true, activity: true }
    )
  }, [])

  // Every page must stay mounted on mobile, because the carousel maps a page
  // index to a tab and an unmounted page would shift the ones after it.
  const shouldRenderPage = useCallback(
    (tab: TabType) => isMobile || openTab === tab || !!initTab?.[tab],
    [initTab, openTab]
  )

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

  // The sessions this screen's pages open are tied to the extension's port through the
  // id in the url, so the background can drop them when the tab goes away (there is no
  // window event for that - see `port.onDisconnect`). Each page owns the lifecycle of
  // its own session, so there is nothing to undo here.
  useEffect(() => {
    setSearchParams((prev) => {
      prev.set('sessionId', sessionId)
      return prev
    })
    // setSearchParams changes identity on every call, so it must stay out of the deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  return (
    <DashboardPagesCarousel
      openTab={openTab}
      setOpenTab={setOpenTab}
      sessionId={sessionId}
      initAllTabs={initAllTabs}
      onRefresh={onRefresh}
      refreshing={refreshing}
    >
      <Tokens
        openTab={pagesOpenTab}
        sessionId={sessionId}
        setOpenTab={setOpenTab}
        onScroll={onScroll}
        initTab={initTab}
        dashboardNetworkFilterName={dashboardNetworkFilterName}
        animatedOverviewHeight={animatedOverviewHeight}
        isSearchHidden={isSearchHidden}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
      {shouldRenderPage('collectibles') && (
        <Collections
          openTab={pagesOpenTab}
          sessionId={sessionId}
          setOpenTab={setOpenTab}
          initTab={initTab}
          onScroll={onScroll}
          networks={networks}
          dashboardNetworkFilterName={dashboardNetworkFilterName}
          animatedOverviewHeight={animatedOverviewHeight}
          isSearchHidden={isSearchHidden}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      {shouldRenderPage('defi') && (
        <DeFiPositions
          openTab={pagesOpenTab}
          sessionId={sessionId}
          setOpenTab={setOpenTab}
          onScroll={onScroll}
          initTab={initTab}
          dashboardNetworkFilterName={dashboardNetworkFilterName}
          animatedOverviewHeight={animatedOverviewHeight}
          isSearchHidden={isSearchHidden}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      {shouldRenderPage('activity') && (
        <Activity
          openTab={pagesOpenTab}
          sessionId={sessionId}
          setOpenTab={setOpenTab}
          onScroll={onScroll}
          initTab={initTab}
          animatedOverviewHeight={animatedOverviewHeight}
          network={network}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}
    </DashboardPagesCarousel>
  )
}

export default React.memo(DashboardPages)
