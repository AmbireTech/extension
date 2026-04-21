import { useCallback, useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { canBecomeSmarter, isSmartAccount } from '@ambire-common/libs/account/account'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import useController from '@common/hooks/useController'

const useHasGasTank = ({ account }: { account: Account | null }) => {
  if (!account || !!account.safeCreation) {
    return {
      canUseGasTank: false,
      hasGasTank: false
    }
  }

  const { keys } = useController('KeystoreController').state

  const isViewOnly = useMemo(
    () => getIsViewOnly(keys, account.associatedKeys),
    [account.associatedKeys, keys]
  )

  const getAccKeys = useCallback(
    (acc: any) => {
      return keys.filter((key) => acc?.associatedKeys.includes(key.addr))
    },
    [keys]
  )
  const isSA = useMemo(() => isSmartAccount(account), [account])

  const hasGasTank = useMemo(() => {
    return !!account && (isSA || canBecomeSmarter(account, getAccKeys(account)))
  }, [account, getAccKeys, isSA])

  const canUseGasTank = useMemo(
    () =>
      (isViewOnly && !account.safeCreation) || // assume all view only accounts CAN use Gas Tank
      isSmartAccount(account) ||
      (canBecomeSmarter(account, getAccKeys(account)) && !account.safeCreation),
    [account, getAccKeys, isViewOnly]
  )

  return {
    canUseGasTank,
    hasGasTank,
    isViewOnly
  }
}

export default useHasGasTank
