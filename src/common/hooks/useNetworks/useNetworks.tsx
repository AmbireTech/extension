import { useEffect, useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { getSupportedNetworks } from '@ambire-common/libs/networks/networks'
import useController from '@common/hooks/useController'

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
  const { state: networks } = useController('NetworksController', (state) => state.networks)
  const {
    state: { accountStates },
    dispatch: accountsDispatch
  } = useController('AccountsController')

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

  const supportedNetworks = useMemo(() => {
    return getSupportedNetworks(networks, accountStates, acc, additionalCheck)
  }, [networks, accountStates, acc, additionalCheck])

  return supportedNetworks
}

export default useNetworks
