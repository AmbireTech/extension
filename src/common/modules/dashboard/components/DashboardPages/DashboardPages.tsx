import { nanoid } from 'nanoid'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
import { useSearchParams } from 'react-router-dom'

import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import Activity from '../Activity'
import Collections from '../Collections'
import DeFiPositions from '../DeFiPositions'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import Tokens from '../Tokens'

interface Props {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  animatedOverviewHeight: Animated.Value
  isSearchHidden: boolean
}

const { isTab } = getUiType()

const DashboardPages = ({ onScroll, isSearchHidden, animatedOverviewHeight }: Props) => {
  const { t } = useTranslation()
  const route = useRoute()
  const [sessionId] = useState(`dashboard-${nanoid()}`)
  const [, setSearchParams] = useSearchParams()
  const {
    state: { dashboardNetworkFilter }
  } = useController('SelectedAccountController')

  const {
    state: { networks }
  } = useController('NetworksController')
  const { dispatch: activityDispatch } = useController('ActivityController')

  const [openTab, setOpenTab] = useState(() => {
    const params = new URLSearchParams(route?.search)

    return (params.get('tab') as TabType) || 'tokens'
  })
  const prevOpenTab = usePrevious(openTab)
  // To prevent initial load of all tabs but load them when requested by the user
  // Persist the rendered list of items for each tab once opened
  // This technique improves the initial loading speed of the dashboard
  const [initTab, setInitTab] = useState<{
    [key: string]: boolean
  }>({})

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

  useEffect(() => {
    // Initialize the port session. This is necessary to automatically terminate the session when the tab is closed.
    // The process is managed in the background using port.onDisconnect,
    // as there is no reliable window event triggered when a tab is closed.
    setSearchParams((prev) => {
      prev.set('sessionId', sessionId)
      return prev
    })

    return () => {
      // Remove session - this will be triggered only when navigation to another screen internally in the extension.
      // The session removal when the window is forcefully closed is handled
      // in the port.onDisconnect callback in the background.
      activityDispatch({
        type: 'method',
        params: { method: 'resetAccountsOpsFilters', args: [sessionId] }
      })
    }
    // setSearchParams must not be in the dependency array
    // as it changes on call and kills the session prematurely
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityDispatch, sessionId])

  return (
    <View style={flexbox.flex1}>
      <Tokens
        openTab={openTab}
        sessionId={sessionId}
        setOpenTab={setOpenTab}
        onScroll={onScroll}
        initTab={initTab}
        dashboardNetworkFilterName={dashboardNetworkFilterName}
        animatedOverviewHeight={animatedOverviewHeight}
        isSearchHidden={isSearchHidden}
      />
      <Collections
        openTab={openTab}
        sessionId={sessionId}
        setOpenTab={setOpenTab}
        initTab={initTab}
        onScroll={onScroll}
        networks={networks}
        dashboardNetworkFilterName={dashboardNetworkFilterName}
        animatedOverviewHeight={animatedOverviewHeight}
        isSearchHidden={isSearchHidden}
      />

      <DeFiPositions
        openTab={openTab}
        sessionId={sessionId}
        setOpenTab={setOpenTab}
        onScroll={onScroll}
        initTab={initTab}
        dashboardNetworkFilterName={dashboardNetworkFilterName}
        animatedOverviewHeight={animatedOverviewHeight}
        isSearchHidden={isSearchHidden}
      />

      <Activity
        openTab={openTab}
        sessionId={sessionId}
        setOpenTab={setOpenTab}
        onScroll={onScroll}
        initTab={initTab}
        animatedOverviewHeight={animatedOverviewHeight}
        network={network}
      />
    </View>
  )
}

export default React.memo(DashboardPages)
