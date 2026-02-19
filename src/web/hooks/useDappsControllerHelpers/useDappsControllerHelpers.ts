import { nanoid } from 'nanoid'
import { useCallback, useEffect, useMemo } from 'react'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import { isValidURL } from '@ambire-common/services/validations'
import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import useControllerState from '@common/hooks/useControllerState'
import { Action, MethodAction } from '@common/types/actions'
import { getCurrentTab } from '@web/extension-services/background/webapi/tab'
import { getCurrentWindow } from '@web/extension-services/background/webapi/window'
import eventBus from '@web/extension-services/event/eventBus'

export default function useDappsControllerHelpers(
  dispatch: (action: MethodAction | Action) => void
) {
  const { state, updateHelpers } = useControllerState({
    id: 'DappsController',
    subscriptionEnabled: true
  })

  const dappSessions = useMemo(() => state.dappSessions ?? {}, [state.dappSessions])

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

  useEffect(() => {
    // Update the store with the method so it can be used by useController('DappsController')
    updateHelpers({ getCurrentDapp })
  }, [getCurrentDapp, updateHelpers])

  useEffect(() => {
    let isCancelled = false

    updateHelpers({ isLoadingCurrentDapp: true })
    getCurrentDapp()
      .then((dapp) => {
        if (!isCancelled) {
          updateHelpers({ currentDapp: dapp, isLoadingCurrentDapp: false })
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          captureException(error)
          updateHelpers({ currentDapp: null, isLoadingCurrentDapp: false })
        }
      })

    return () => {
      isCancelled = true
    }
  }, [getCurrentDapp, updateHelpers])
}
