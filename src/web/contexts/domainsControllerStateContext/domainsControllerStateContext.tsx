import { getAddress } from 'ethers'
/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useCallback, useEffect, useMemo, useReducer } from 'react'

import { networks } from '@ambire-common/consts/networks'
import { DomainsController } from '@ambire-common/controllers/domains/domains'
import { IDomainsController } from '@ambire-common/interfaces/domains'
import { getRpcProvider } from '@ambire-common/services/provider'
import { isBenzin, isLegends } from '@common/config/env'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const DomainsControllerStateContext = createContext<{
  state: IDomainsController
  reverseLookup: (address: string) => void
  saveResolvedDomain: (props: {
    address: string
    ensAvatar: string | null
    name: string
    type: 'ens'
  }) => void
}>({
  state: {} as IDomainsController,
  reverseLookup: () => {},
  saveResolvedDomain: () => {}
})

const controller = 'DomainsController'

const BenzinAndLegendsDomainsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [rerender, forceRerender] = useReducer((x) => x + 1, 0)

  const ethereum = useMemo(() => networks.find(({ chainId }) => chainId === 1n)!, [])

  const providers = useMemo(() => {
    return { '1': getRpcProvider(ethereum.rpcUrls, 1n, ethereum.selectedRpcUrl) }
  }, [ethereum])

  const domainsCtrl = useMemo(() => new DomainsController({ providers }), [providers])

  useEffect(() => {
    const unsubscribe = domainsCtrl.onUpdate(forceRerender)
    return unsubscribe
  }, [domainsCtrl])

  const reverseLookup = useCallback(
    (address: string) => {
      const checksummedAddress = getAddress(address)

      domainsCtrl.reverseLookup(checksummedAddress, true).catch((e) => {
        console.error('Failed to resolve domain for address', checksummedAddress, e)
      })
    },
    [domainsCtrl]
  )

  const saveResolvedDomain = useCallback(
    (props: { address: string; ensAvatar: string | null; name: string; type: 'ens' }) => {
      domainsCtrl.saveResolvedReverseLookup(props)
    },
    [domainsCtrl]
  )

  return (
    <DomainsControllerStateContext.Provider
      value={useMemo(
        () => ({ state: domainsCtrl, reverseLookup, saveResolvedDomain }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [domainsCtrl, reverseLookup, saveResolvedDomain, rerender]
      )}
    >
      {children}
    </DomainsControllerStateContext.Provider>
  )
}

const ExtensionDomainsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (mainState.isReady && !Object.keys(state).length) {
      dispatch({
        type: 'INIT_CONTROLLER_STATE',
        params: { controller }
      })
    }
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  const reverseLookup = useCallback(
    (address: string) => {
      dispatch({ type: 'DOMAINS_CONTROLLER_REVERSE_LOOKUP', params: { address } })
    },
    [dispatch]
  )

  const saveResolvedDomain = useCallback(
    (props: { address: string; ensAvatar: string | null; name: string; type: 'ens' }) => {
      dispatch({
        type: 'DOMAINS_CONTROLLER_SAVE_RESOLVED_REVERSE_LOOKUP',
        params: props
      })
    },
    [dispatch]
  )

  return (
    <DomainsControllerStateContext.Provider
      value={useMemo(
        () => ({ state: memoizedState, reverseLookup, saveResolvedDomain }),
        [memoizedState, reverseLookup, saveResolvedDomain]
      )}
    >
      {children}
    </DomainsControllerStateContext.Provider>
  )
}

const DomainsControllerStateProvider: React.FC<React.PropsWithChildren> = (props) => {
  return isBenzin || isLegends ? (
    <BenzinAndLegendsDomainsProvider {...props} />
  ) : (
    <ExtensionDomainsProvider {...props} />
  )
}

export { DomainsControllerStateProvider, DomainsControllerStateContext }
