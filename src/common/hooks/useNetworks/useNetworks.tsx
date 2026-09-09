import { useEffect, useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { getSupportedNetworks } from '@ambire-common/libs/networks/networks'
import useController from '@common/hooks/useController'

import type { NetworksController } from '@ambire-common/controllers/networks/networks'

const selectNetworks = (state: NetworksController) => state.networks

/**
 * This returns all enabled networks in the extension with
 * a disabled flag & reason for those that are not supported
 * by the account OR the swap and bridge provider
 */
const useNetworks = ({
  acc,
  additionalCheck
}: {
  acc?: Account | null
  additionalCheck?: {
    chainIds: bigint[]
    reason: string
  }
}) => {
  const { state: networks } = useController('NetworksController', selectNetworks)

  const { state: accountStates, dispatch: accountsDispatch } = useController(
    'AccountsController',
    'accountStates'
  )

  // Safe accounts are dependant on the account state so be sure to fetch it
  // if it's not already fetched
  useEffect(() => {
    if (!acc || !acc.safeCreation || !!accountStates[acc.addr]) return

    accountsDispatch({
      type: 'method',
      params: {
        method: 'updateAccountState',
        args: [acc.addr, 'latest']
      }
    })
  }, [acc, accountStates, accountsDispatch])

  // Callers pass `additionalCheck` as an object literal, so memoizing on it directly
  // rebuilds the network list on every render of every caller. Everything downstream
  // keys off this array's identity - the token Select rebuilds all of its options - so
  // it is memoized on the contents instead.
  const additionalCheckChainIdsKey = additionalCheck?.chainIds.join() || ''
  const additionalCheckReason = additionalCheck?.reason

  // Rebuilt from the key rather than closing over the caller's array, so the result
  // depends on nothing whose identity churns per render.
  const knownAdditionalCheck = useMemo(() => {
    if (!additionalCheckChainIdsKey || !additionalCheckReason) return undefined

    return {
      chainIds: additionalCheckChainIdsKey.split(',').map((chainId) => BigInt(chainId)),
      reason: additionalCheckReason
    }
  }, [additionalCheckChainIdsKey, additionalCheckReason])

  const supportedNetworks = useMemo(() => {
    return getSupportedNetworks(networks, accountStates, acc, knownAdditionalCheck)
  }, [networks, accountStates, acc, knownAdditionalCheck])

  return supportedNetworks
}

export default useNetworks
