import { useCallback, useMemo } from 'react'

import { AMBIRE_ACCOUNT_FACTORY } from '@ambire-common/consts/deploy'
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

    // not available for v1 accounts
    // one could argue if checking the factoryAddr is the best approach for this
    // but the alternative is checking the account state (onchain metric),
    // causing this simple component to become needlessly more diffucult.
    // Collateral damage might become old v2 SAs we used for testing that
    // are already deprecated and chances are the gas tank doesn't work there
    // so it's better to disable it for them as well
    if (account.creation && account.creation.factoryAddr !== AMBIRE_ACCOUNT_FACTORY) return false

    if (isViewOnly) return true // assume view only accounts CAN use Gas Tank, not knowing their key types yet

    return isSmartAccount(account) || canBecomeSmarter(account, getAccKeys(account))
  }, [account, getAccKeys, isViewOnly])

  return { canUseGasTank, isViewOnly }
}

export default useHasGasTank
