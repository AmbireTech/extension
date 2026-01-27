/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { Dapp, IDappsController } from '@ambire-common/interfaces/dapp'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import { isValidURL } from '@ambire-common/services/validations'
import { getCurrentTab } from '@web/extension-services/background/webapi/tab'
import { getCurrentWindow } from '@web/extension-services/background/webapi/window'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'

const DappsControllerStateContext = createContext<{
  state: IDappsController
  currentDapp: Dapp | null
}>({
  state: {} as IDappsController,
  currentDapp: null
})

const DappsControllerStateProvider: React.FC<any> = ({ children }) => {
  const [currentDapp, setCurrentDapp] = useState<Dapp | null>(null)
  const { dispatch } = useBackgroundService()

  const dappsControllerStateCallback = useCallback(
    async (newState: IDappsController) => {
      const tab = await getCurrentTab()
      const window = await getCurrentWindow()

      if (!tab || !tab.id || !tab.url) return

      const dappId = getDappIdFromUrl(new URL(tab.url).origin)
      const currentSession = newState.dappSessions?.[`${window.id}-${tab.id}-${dappId}`] || {}
      const dapp = newState.dapps.find((d) => d.id === currentSession.id || d.id === dappId)

      if (dapp) {
        setCurrentDapp(dapp)
      } else if (
        Object.keys(currentSession).length &&
        isValidURL(tab.url) &&
        currentSession.isWeb3App
      ) {
        setCurrentDapp({
          id: dappId,
          url: tab.url,
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
      } else if (!Object.keys(currentSession).length && !dapp && currentDapp) {
        setCurrentDapp(null)
      }
    },
    [currentDapp]
  )

  const controller = 'DappsController'
  const state = useControllerState(controller, dappsControllerStateCallback)
  useEffect(() => {
    dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller: 'DappsController' } })
  }, [dispatch])

  return (
    <DappsControllerStateContext.Provider
      value={useMemo(() => ({ state, currentDapp }), [state, currentDapp])}
    >
      {children}
    </DappsControllerStateContext.Provider>
  )
}

export { DappsControllerStateProvider, DappsControllerStateContext }
