import { nanoid } from 'nanoid'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import { isValidURL } from '@ambire-common/services/validations'
import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import useControllerState from '@common/hooks/useControllerState'
import eventBus from '@common/services/event/eventBus'
import { Action, MethodAction } from '@common/types/actions'
import { browser, isExtension } from '@web/constants/browserapi'
import { getCurrentTab } from '@web/extension-services/background/webapi/tab'
import { getCurrentWindow } from '@web/extension-services/background/webapi/window'

export default function useDappsControllerHelpers(
  dispatch: (action: MethodAction | Action) => void
) {
  const { state, updateHelpers } = useControllerState({
    id: 'DappsController',
    subscriptionEnabled: true
  })

  const dappSessions = useMemo(() => state.dappSessions ?? {}, [state.dappSessions])
  const trackedWindowIdRef = useRef<number | undefined>(undefined)
  const refreshRequestIdRef = useRef(0)
  const lastFetchedTabKeyRef = useRef('')

  const getCurrentDapp = useCallback(async () => {
    const requestId = nanoid()
    const tab = await getCurrentTab()
    const window = await getCurrentWindow()
    const windowId = window.id
    const tabId = tab?.id
    const tabUrl = tab?.url

    if (!tab || !tabId || !tabUrl) return null

    const dappId = getDappIdFromUrl(new URL(tabUrl).origin)
    const currentSessionId = dappSessions?.[`${windowId}-${tabId}-${dappId}`]?.id

    dispatch({
      type: 'method',
      params: {
        ctrlName: 'DappsController',
        method: 'getCurrentDappAndSendResToUi',
        args: [{ requestId, dappId, currentSessionId }]
      }
    })

    return new Promise<Dapp | null>((resolve, reject) => {
      let settled = false

      const cleanup = () => {
        eventBus.removeEventListener('receiveOneTimeData', onResponse)
        clearTimeout(timeoutId)
      }

      const onResponse = (data: any) => {
        if (data?.type !== 'GetCurrentDappRes' || data?.requestId !== requestId) return
        if (settled) return

        settled = true
        cleanup()

        if (!data.ok) return reject(new Error(data.error ?? 'Getting current dapp failed'))
        if (data.res) return resolve(data.res as Dapp)

        const currentSession = dappSessions?.[`${windowId}-${tabId}-${dappId}`]
        const missingInAppsCatalogButStillValidDapp =
          currentSession && tabUrl && isValidURL(tabUrl) && currentSession.isWeb3App

        if (missingInAppsCatalogButStillValidDapp)
          return resolve({
            id: dappId,
            url: tabUrl,
            name: currentSession.name,
            icon: currentSession.icon,
            isConnected: false,
            description: '',
            chainId: 1,
            favorite: false,
            category: null,
            twitter: null,
            tvl: null,
            chainIds: [],
            geckoId: null,
            isCustom: true,
            blacklisted: 'VERIFIED',
            isFeatured: false
          })

        // at this post, result must be null
        return resolve(data.res as null)
      }

      const timeoutId = setTimeout(() => {
        if (settled) return
        settled = true

        cleanup()
        reject(new Error('Getting current dapp timed out after 10 seconds'))
      }, 10_000)

      eventBus.addEventListener('receiveOneTimeData', onResponse)
    })
  }, [dispatch, dappSessions])

  const refreshCurrentDapp = useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      const tab = await getCurrentTab()
      const tabId = tab?.id
      const tabUrl = tab?.url

      if (!tabId || !tabUrl) {
        lastFetchedTabKeyRef.current = ''
        ++refreshRequestIdRef.current
        updateHelpers({ currentDapp: null, isLoadingCurrentDapp: false })
        return
      }

      let tabKey = `${tabId}`
      try {
        tabKey = `${tabId}-${new URL(tabUrl).origin}`
      } catch {
        // keep tabId-only key
      }

      if (!force && tabKey === lastFetchedTabKeyRef.current) return

      lastFetchedTabKeyRef.current = tabKey
      const requestId = ++refreshRequestIdRef.current

      updateHelpers({ isLoadingCurrentDapp: true })

      try {
        const dapp = await getCurrentDapp()
        if (requestId !== refreshRequestIdRef.current) return

        updateHelpers({ currentDapp: dapp, isLoadingCurrentDapp: false })
      } catch (error) {
        if (requestId !== refreshRequestIdRef.current) return

        captureException(error)
        updateHelpers({ currentDapp: null, isLoadingCurrentDapp: false })
      }
    },
    [getCurrentDapp, updateHelpers]
  )

  const hasUnverifiedDapps = useCallback(
    async (dapps: string[]) => {
      if (!dapps.length) return false

      const requestId = nanoid()

      dispatch({
        type: 'method',
        params: {
          ctrlName: 'DappsController',
          method: 'hasUnverifiedDappsAndSendResToUi',
          args: [{ requestId, dapps }]
        }
      })

      return new Promise<boolean>((resolve, reject) => {
        let settled = false

        const cleanup = () => {
          eventBus.removeEventListener('receiveOneTimeData', onResponse)
          clearTimeout(timeoutId)
        }

        const onResponse = (data: any) => {
          if (data?.type !== 'HasUnverifiedDappsRes' || data?.requestId !== requestId) return
          if (settled) return

          settled = true
          cleanup()

          if (!data.ok)
            return reject(
              new Error(
                data.error ?? 'App validation failed. DappsController returned a non-OK response.'
              )
            )

          return resolve(!!data.res)
        }

        const timeoutId = setTimeout(() => {
          if (settled) return
          settled = true

          cleanup()
          reject(new Error('App validation failed: timed out after 10 seconds.'))
        }, 10_000)

        eventBus.addEventListener('receiveOneTimeData', onResponse)
      })
    },
    [dispatch]
  )

  useEffect(() => {
    // Update the store with the method so it can be used by useController('DappsController')
    updateHelpers({ getCurrentDapp, hasUnverifiedDapps })
  }, [getCurrentDapp, hasUnverifiedDapps, updateHelpers])

  useEffect(() => {
    if (!isExtension || !browser?.tabs) return undefined

    let isCancelled = false

    const syncTrackedWindowId = async () => {
      const window = await getCurrentWindow()
      trackedWindowIdRef.current = window.id
    }

    const isTrackedWindowTab = (windowId?: number) =>
      trackedWindowIdRef.current !== undefined && windowId === trackedWindowIdRef.current

    const onTabActivated = async ({ windowId }: chrome.tabs.TabActiveInfo) => {
      if (!isTrackedWindowTab(windowId)) return

      lastFetchedTabKeyRef.current = ''
      if (!isCancelled) await refreshCurrentDapp({ force: true })
    }

    const onTabUpdated = async (
      _tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      if (!changeInfo.url || !tab.active || !isTrackedWindowTab(tab.windowId)) return

      if (!isCancelled) await refreshCurrentDapp()
    }

    const init = async () => {
      await syncTrackedWindowId()
      if (!isCancelled) await refreshCurrentDapp({ force: true })
    }

    init()

    browser.tabs.onActivated.addListener(onTabActivated)
    browser.tabs.onUpdated.addListener(onTabUpdated)

    return () => {
      isCancelled = true
      browser.tabs.onActivated.removeListener(onTabActivated)
      browser.tabs.onUpdated.removeListener(onTabUpdated)
    }
  }, [refreshCurrentDapp])

  useEffect(() => {
    refreshCurrentDapp({ force: true })
  }, [dappSessions, refreshCurrentDapp])
}
