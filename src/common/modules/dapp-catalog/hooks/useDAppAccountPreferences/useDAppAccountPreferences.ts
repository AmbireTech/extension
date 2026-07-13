import { useCallback, useEffect, useState } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { DappAccountPreferences } from '@ambire-common/interfaces/dapp'
import useController from '@common/hooks/useController'

const useDAppAccountPreferences = (
  id: string,
  target: 'dappToConnect' | 'existingDapp',
  accountPreferences?: DappAccountPreferences
) => {
  const {
    state: { accounts }
  } = useController('AccountsController')
  const { dispatch } = useController('DappsController')
  const { state: selectedAccountState } = useController('SelectedAccountController')

  // The state is needed because useMemo will recalculate on every rerender, which causes the Flatlist to be reordered
  // on every select/deselect of an account, which makes UX awful. Instead, we update the list on accounts change
  // and when the bottom sheet is closed
  const [orderedAccountList, setOrderedAccountList] = useState<Account[]>(accounts)
  const selectedAccount = selectedAccountState.account

  const [localPreferences, setLocalPreferences] = useState<DappAccountPreferences | undefined>(
    accountPreferences
  )

  // A dedicated method with two blocks is needed because typescript displays an
  // error if we try to use ternary for the method param
  const updateTarget = useCallback(
    (newPreferences: DappAccountPreferences) => {
      if (target === 'dappToConnect') {
        dispatch({
          type: 'method',
          params: {
            method: 'updateDappToConnect',
            args: [id, { accountPreferences: newPreferences }]
          }
        })
      } else {
        dispatch({
          type: 'method',
          params: {
            method: 'updateDapp',
            args: [id, { accountPreferences: newPreferences }]
          }
        })
      }
    },
    [dispatch, id, target]
  )

  const toggleSelectAccount = useCallback(
    (address: string) => {
      if (!selectedAccount) {
        console.error('No selected account found, cannot toggle account selection for dapp')
        return
      }

      const isCurrentlySelected = localPreferences?.accounts.includes(address)
      let nextAccountList = isCurrentlySelected
        ? localPreferences?.accounts.filter((addr) => addr !== address) || []
        : [...(localPreferences?.accounts || []), address]
      let nextSelectedAccount = localPreferences?.selectedAccount

      if (!nextSelectedAccount || !nextAccountList.includes(nextSelectedAccount)) {
        nextSelectedAccount = nextAccountList[0] || selectedAccount.addr
      }

      setLocalPreferences({
        enabled: true,
        accounts: nextAccountList,
        selectedAccount: nextSelectedAccount
      })
    },

    [selectedAccount, localPreferences?.accounts, localPreferences?.selectedAccount]
  )

  const toggleOnlyConnectWithSomeAccounts = useCallback(() => {
    if (!selectedAccount) {
      console.error(
        'No selected account found, cannot toggle only connect with some accounts for dapp'
      )
      return
    }

    setLocalPreferences((prev) => {
      const next = {
        enabled: !prev?.enabled,
        accounts: prev?.accounts.length ? prev.accounts : [selectedAccount.addr],
        selectedAccount: prev?.selectedAccount || selectedAccount.addr
      }

      // Update before saving because the toggle is outside of the modal, so the user
      // may enabled it, decide to select accounts, save, and then disable it again without opening the modal
      if (target === 'dappToConnect') {
        updateTarget(next)
      }

      return next
    })
  }, [selectedAccount, target, updateTarget])

  const save = useCallback(() => {
    if (!localPreferences) return

    updateTarget(localPreferences)
  }, [localPreferences, updateTarget])

  const updateOrderedAccountList = useCallback(() => {
    setOrderedAccountList(() => {
      if (!selectedAccount) return accounts

      const selectedAccountFirst = accounts.find((acc) => acc.addr === selectedAccount.addr)
      const otherAccounts = accounts
        .filter((acc) => acc.addr !== selectedAccount.addr)
        .sort((a, b) => {
          const aInPreferences = accountPreferences?.accounts.includes(a.addr)
          const bInPreferences = accountPreferences?.accounts.includes(b.addr)

          if (aInPreferences && !bInPreferences) return -1
          if (!aInPreferences && bInPreferences) return 1
          return 0
        })

      return selectedAccountFirst ? [selectedAccountFirst, ...otherAccounts] : otherAccounts
    })
  }, [accounts, accountPreferences?.accounts, selectedAccount])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateOrderedAccountList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length])

  return {
    accounts,
    selectedAccount,
    orderedAccountList,
    toggleSelectAccount,
    toggleOnlyConnectWithSomeAccounts,
    updateOrderedAccountList,
    localPreferences,
    save,
    updateLocalPreferences: setLocalPreferences
  }
}

export default useDAppAccountPreferences
