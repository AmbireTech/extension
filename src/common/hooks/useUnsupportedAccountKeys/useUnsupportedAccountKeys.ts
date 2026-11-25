import { useCallback, useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import useController from '@common/hooks/useController'
import { selectUnsupportedKeys } from '@common/utils/keys'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

// Stable, so the hook doesn't return a new array (and re-render) without an account
const NO_KEYS: Key[] = []

/**
 * The account's imported keys that can't sign on this device, as they were synced from a device
 * that supports them (e.g. a GridPlus key on mobile). With a network, only its signers there, as
 * they may differ per network (a Safe's owners, an Ambire v1 account's signers). Before the
 * account state loads, the keys the account was imported with
 */
const useUnsupportedAccountKeys = (account: Account | null | undefined, chainId?: bigint) => {
  const accountAddr = account?.addr
  const selectChainSigners = useCallback(
    (state: AllControllersMappingType['AccountsController']) =>
      accountAddr && chainId
        ? state.accountStates?.[accountAddr]?.[chainId.toString()]?.associatedKeys
        : undefined,
    [accountAddr, chainId]
  )
  const { state: chainSigners } = useController('AccountsController', selectChainSigners)
  const { state: unsupportedKeys } = useController('KeystoreController', selectUnsupportedKeys)

  return useMemo(() => {
    if (!account) return NO_KEYS
    const signers = new Set(
      (chainSigners || account.associatedKeys).map((addr) => addr.toLowerCase())
    )
    return unsupportedKeys.filter((key) => signers.has(key.addr.toLowerCase()))
  }, [account, chainSigners, unsupportedKeys])
}

export default useUnsupportedAccountKeys
