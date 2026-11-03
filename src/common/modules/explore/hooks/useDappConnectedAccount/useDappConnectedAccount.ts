import { useMemo } from 'react'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { getAccountsForDapp } from '@ambire-common/libs/dapps/helpers'
import useController from '@common/hooks/useController'

/**
 * The account an app sees: the one picked for it, otherwise the selected one when the app may
 * see it, otherwise the last account the app used. Without an app it's the selected account.
 */
const useDappConnectedAccount = (dapp: Pick<Dapp, 'accountPreferences'> | null | undefined) => {
  const { state: selectedAccount } = useController('SelectedAccountController', 'account')
  const { state: accounts } = useController('AccountsController', 'accounts')

  return useMemo(() => {
    const [connectedAddr] = getAccountsForDapp(dapp?.accountPreferences, selectedAccount?.addr)

    return accounts.find((acc) => acc.addr === connectedAddr) ?? selectedAccount
  }, [dapp?.accountPreferences, selectedAccount, accounts])
}

export default useDappConnectedAccount
