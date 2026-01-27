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
  resolveDomain: (address: string) => void
  saveResolvedDomain: (
    address: string,
    ensAvatar: string | null,
    domain: string,
    type: 'ens'
  ) => void
}>({
  state: {} as IDomainsController,
  resolveDomain: () => {},
  saveResolvedDomain: () => {}
})

const controller = 'DomainsController'

const BenzinAndLegendsDomainsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [, forceRerender] = useReducer((x) => x + 1, 0)

  const ethereum = useMemo(() => networks.find(({ chainId }) => chainId === 1n)!, [])

  const providers = useMemo(() => {
    return { '1': getRpcProvider(ethereum.rpcUrls, 1n, ethereum.selectedRpcUrl) }
  }, [ethereum])

  const domainsCtrl = useMemo(() => new DomainsController({ providers }), [providers])

  useEffect(() => {
    const unsubscribe = domainsCtrl.onUpdate(forceRerender)
    return unsubscribe
  }, [domainsCtrl])

  const memoizedDomainCtrl = useDeepMemo(domainsCtrl, controller)

  const resolveDomain = useCallback((address: string) => {
    const checksummedAddress = getAddress(address)

    domainsCtrl.reverseLookup(checksummedAddress).catch((e) => {
      console.error('Failed to resolve domain for address', checksummedAddress, e)
    })
  }, [])

  const saveResolvedDomain = useCallback(
    (address: string, ensAvatar: string | null, domain: string, type: 'ens') => {
      domainsCtrl.saveResolvedReverseLookup({ address, type, ensAvatar, name: domain })
    },
    []
  )

  return (
    <DomainsControllerStateContext.Provider
      value={useMemo(
        () => ({ state: memoizedDomainCtrl, resolveDomain, saveResolvedDomain }),
        [memoizedDomainCtrl, resolveDomain, saveResolvedDomain]
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

  const resolveDomain = useCallback((address: string) => {
    dispatch({ type: 'DOMAINS_CONTROLLER_REVERSE_LOOKUP', params: { address } })
  }, [])

  const saveResolvedDomain = useCallback(
    (address: string, ensAvatar: string | null, domain: string, type: 'ens') => {
      dispatch({
        type: 'DOMAINS_CONTROLLER_SAVE_RESOLVED_REVERSE_LOOKUP',
        params: { address, ensAvatar, type, name: domain }
      })
    },
    []
  )

  return (
    <DomainsControllerStateContext.Provider
      value={useMemo(
        () => ({ state: memoizedState, resolveDomain, saveResolvedDomain }),
        [memoizedState, resolveDomain, saveResolvedDomain]
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
