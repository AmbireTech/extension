import { nanoid } from 'nanoid'
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { Dapp, IDappsController } from '@ambire-common/interfaces/dapp'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import { getCurrentTab } from '@web/extension-services/background/webapi/tab'
import { getCurrentWindow } from '@web/extension-services/background/webapi/window'
import eventBus from '@web/extension-services/event/eventBus'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'

const DappsControllerStateContext = createContext<{
  state: IDappsController
  currentDapp: Dapp | null
  isLoadingCurrentDapp: boolean
}>({
  state: {} as IDappsController,
  currentDapp: null,
  isLoadingCurrentDapp: true
})

const DappsControllerStateProvider: React.FC<any> = ({ children }) => {
  const { dispatch } = useBackgroundService()

  const getCurrentDapp = useCallback(async () => {
    const requestId = nanoid()
    const tab = await getCurrentTab()
    const window = await getCurrentWindow()
    const windowId = window.id
    const tabId = tab?.id
    const tabUrl = tab?.url

    if (!tab || !tabId || !tabUrl) return null

    const dappId = getDappIdFromUrl(new URL(tabUrl).origin)

    dispatch({
      type: 'DAPPS_CONTROLLER_GET_CURRENT_DAPP_AND_SEND_RES_TO_UI',
      params: { requestId, dappId, windowId, tabId, tabUrl }
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

        if (data.ok) {
          resolve(data.res as Dapp | null)
        } else {
          reject(new Error(data.error ?? 'Getting current dapp failed'))
        }
      }

      const timeoutId = setTimeout(() => {
        if (settled) return
        settled = true

        cleanup()
        reject(new Error('Getting current dapp timed out after 10 seconds'))
      }, 10_000)

      eventBus.addEventListener('receiveOneTimeData', onResponse)
    })
  }, [dispatch])

  const controller = 'DappsController'
  const state = useControllerState(controller)
  const [currentDapp, setCurrentDapp] = useState<Dapp | null>(null)
  const [isLoadingCurrentDapp, setIsLoadingCurrentDapp] = useState(true)

  useEffect(() => {
    dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller: 'DappsController' } })
  }, [dispatch])

  useEffect(() => {
    setIsLoadingCurrentDapp(true)
    getCurrentDapp()
      .then((dapp) => setCurrentDapp(dapp))
      .catch(() => setCurrentDapp(null)) // TODO: Send crash report?
      .finally(() => setIsLoadingCurrentDapp(false))
  }, [getCurrentDapp])

  return (
    <DappsControllerStateContext.Provider
      value={useMemo(
        () => ({ state, currentDapp, isLoadingCurrentDapp }),
        [state, currentDapp, isLoadingCurrentDapp]
      )}
    >
      {children}
    </DappsControllerStateContext.Provider>
  )
}

export { DappsControllerStateProvider, DappsControllerStateContext }
