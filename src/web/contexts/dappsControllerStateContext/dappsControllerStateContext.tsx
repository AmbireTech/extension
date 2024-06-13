/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect, useMemo, useState } from 'react'

import { Session } from '@ambire-common/classes/session'
import { DappsController } from '@ambire-common/controllers/dapps/dapps'
import { Dapp } from '@ambire-common/interfaces/dapp'
import { getCurrentTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import getOriginFromUrl from '@web/utils/getOriginFromUrl'

// @ts-ignore
interface DappControllerState extends DappsController {
  dappsSessionMap: {
    [k: string]: Session
  }
}

const DappsControllerStateContext = createContext<{
  state: DappControllerState
  currentDapp: Dapp | null
}>({
  state: {} as DappControllerState,
  currentDapp: null
})

const DappsControllerStateProvider: React.FC<any> = ({ children }) => {
  const [currentDapp, setCurrentDapp] = useState<Dapp | null>(null)
  const { dispatch } = useBackgroundService()
  const controller = 'dapps'
  const state = useControllerState(controller, async (newState: DappsController) => {
    const tab = await getCurrentTab()
    if (!tab.id || !tab.url) return
    const domain = getOriginFromUrl(tab.url)
    // @ts-ignore
    const currentSession = newState.dappsSessionMap?.[`${tab.id}-${domain}`] || {}

    const dapp = newState.dapps.find((d) => d.url === currentSession.origin)

    if (dapp) {
      setCurrentDapp(dapp)
    } else if (currentSession.name && currentSession.icon) {
      setCurrentDapp({
        url: currentSession.origin,
        name: currentSession.name,
        icon: currentSession.icon,
        isConnected: false,
        description: '',
        chainId: 1,
        favorite: false
      })
    }
  })
  useEffect(() => {
    dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller: 'dapps' } })
  }, [dispatch])

  return (
    <DappsControllerStateContext.Provider
      value={useMemo(
        () => ({
          state: state as never as DappControllerState,
          currentDapp
        }),
        [state, currentDapp]
      )}
    >
      {children}
    </DappsControllerStateContext.Provider>
  )
}

export { DappsControllerStateProvider, DappsControllerStateContext }
