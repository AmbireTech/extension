import { useCallback, useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { canBecomeSmarter, isSmartAccount } from '@ambire-common/libs/account/account'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import useController from '@common/hooks/useController'

const useHasGasTank = ({ account }: { account: Account | null }) => {
  const { keys } = useController('KeystoreController').state

  const isViewOnly = useMemo(
    () => account && getIsViewOnly(keys, account.associatedKeys),
    [account, keys]
  )

  const getAccKeys = useCallback(
    (acc: any) => keys.filter((key) => acc?.associatedKeys.includes(key.addr)),
    [keys]
  )

  const canUseGasTank = useMemo(() => {
    if (!account) return false

    if (account.safeCreation) return false // not available for Safe accounts

    if (isViewOnly) return true // assume view only accounts CAN use Gas Tank, not knowing their key types yet

    return isSmartAccount(account) || canBecomeSmarter(account, getAccKeys(account))
  }, [account, getAccKeys, isViewOnly])

  return { canUseGasTank, isViewOnly }
}

export default useHasGasTank
