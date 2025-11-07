import { useCallback, useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { canBecomeSmarter, isSmartAccount } from '@ambire-common/libs/account/account'
import { getIsViewOnly } from '@ambire-common/utils/accounts'

import useKeystoreControllerState from '../useKeystoreControllerState'

const useHasGasTank = ({ account }: { account: Account | null }) => {
  if (!account) {
    return {
      hasGasTank: false
    }
  }

  const { keys } = useKeystoreControllerState()

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

  return {
    hasGasTank,
    isViewOnly: getIsViewOnly(keys, account.associatedKeys)
  }
}

export default useHasGasTank
