/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'

import { Dapp, IDappsController } from '@ambire-common/interfaces/dapp'
import { getDappIdFromUrl } from '@ambire-common/libs/dapps/helpers'
import { isValidURL } from '@ambire-common/services/validations'
import { getCurrentTab } from '@web/extension-services/background/webapi/tab'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import getOriginFromUrl from '@web/utils/getOriginFromUrl'

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

  const dappsControllerStateCallback = useCallback(async (newState: IDappsController) => {
    const tab = await getCurrentTab()
    if (!tab || !tab.id || !tab.url) return

    const origin = getOriginFromUrl(tab.url)
    const dappId = getDappIdFromUrl(tab.url, newState.dapps)
    const currentSession = newState.dappSessions?.[`${tab.id}-${origin}`] || {}
    const dapp = newState.dapps.find((d) => d.id === currentSession.id || d.id === dappId)

    if (dapp) {
      setCurrentDapp(dapp)
    } else if (
      currentSession.name &&
      currentSession.origin &&
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
        isFeatured: false
      })
    }
  }, [])

  const controller = 'dapps'
  const state = useControllerState(controller, dappsControllerStateCallback)
  useEffect(() => {
    dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller: 'dapps' } })
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
