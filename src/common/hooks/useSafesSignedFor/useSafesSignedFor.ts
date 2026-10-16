import { useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

/** The user's Safe accounts that the given account is a signer of */
const useSafesSignedFor = (account: Account): Account[] => {
  const { state: accounts } = useController('AccountsController', selectAccounts)

  return useMemo(
    () =>
      accounts.filter((safe) => !!safe.safeCreation && safe.associatedKeys.includes(account.addr)),
    [account.addr, accounts]
  )
}

export default useSafesSignedFor
