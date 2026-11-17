import { useEffect, useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/**
 * The chains a Safe account is deployed on, empty for any other account and until they are
 * known. The wallet keeps the on-chain state of the selected account only, so a Safe's is
 * fetched when missing.
 */
const useSafeDeployedChainIds = (account: Account): string[] => {
  const { addr, safeCreation } = account
  const isSafe = !!safeCreation
  // A string, compared by value, as the controller updates the state of each chain in place
  const selectDeployedChainIdsKey = useMemo(
    () => (state: AllControllersMappingType['AccountsController']) => {
      const accountState = isSafe ? state.accountStates[addr] : undefined
      if (!accountState) return null

      return Object.keys(accountState)
        .filter((chainId) => accountState[chainId]!.isDeployed)
        .join()
    },
    [addr, isSafe]
  )
  const { state: deployedChainIdsKey, dispatch: accountsDispatch } = useController(
    'AccountsController',
    selectDeployedChainIdsKey
  )
  const hasAccountState = deployedChainIdsKey !== null

  useEffect(() => {
    if (!isSafe || hasAccountState) return

    accountsDispatch({
      type: 'method',
      params: { method: 'updateAccountState', args: [addr, 'latest'] }
    })
  }, [accountsDispatch, addr, hasAccountState, isSafe])

  return useMemo(
    () => (deployedChainIdsKey ? deployedChainIdsKey.split(',') : []),
    [deployedChainIdsKey]
  )
}

export default useSafeDeployedChainIds
