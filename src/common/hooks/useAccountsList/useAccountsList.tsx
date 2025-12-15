import Fuse from 'fuse.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FlatList } from 'react-native'

import { Account as AccountType } from '@ambire-common/interfaces/account'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

const useAccountsList = ({
  flatlistRef
}: {
  flatlistRef?: React.RefObject<FlatList<AccountType>> | null
} = {}) => {
  const { control, watch } = useForm({
    mode: 'all',
    defaultValues: {
      search: ''
    }
  })
  const search = watch('search')
  const [shouldDisplayAccounts, setShouldDisplayAccounts] = useState(false)
  const { domains } = useDomainsControllerState()
  const { accounts } = useAccountsControllerState()
  const { account: selectedAccount } = useSelectedAccountControllerState()
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const searchableAccounts = useMemo(
    () =>
      accounts.map((account) => ({
        account,
        label: account.preferences.label.toLowerCase(),
        domain: domains[account.addr]?.ens?.toLowerCase().trim() || '',
        address: account.addr.toLowerCase(),
        smart: isSmartAccount(account) ? 'smart' : ''
      })),
    [accounts, domains]
  )

  const filteredAccounts = useMemo(() => {
    if (!search) return accounts

    const fuse = new Fuse(searchableAccounts, {
      keys: [
        { name: 'label', weight: 0.5 },
        { name: 'domain', weight: 0.3 },
        { name: 'address', weight: 0.1 },
        { name: 'smart', weight: 0.1 }
      ],
      threshold: 0.3,
      /*
      `ignoreLocation = false`:
      - Fuse prioritizes matches that appear near the beginning of the string
        (e.g. typing "vi" ranks "Vitalik" above "MyVitalikWallet").
      - We set this explicitly, even though it's the default, to avoid accidental overrides during future refactoring.

      `distance = 1000`:
      - ETH addresses are long, and valid matches often appear near the end.
        By default, Fuse scores these lower, which may exclude them.
      - distance reduces this penalty so such matches are still returned
        (e.g. searching for "33" should match 0x579f87277E14f32df7FA4036D76BbfC94C325033 even though "33" is at the end).
      - distance does NOT represent string length - it controls how strongly Fuse penalizes late-position matches.
        A large value reduces this penalty so end-of-string matches are still returned while start matches remain prioritized.

      Summary:
      - ignoreLocation: false → keep prioritizing early-position matches
      - distance: 1000 → allow matches anywhere in the string without discarding them
      */
      ignoreLocation: false,
      distance: 1000
    })

    const results = fuse.search(search)
    return results.map((result) => result.item.account)
  }, [accounts, searchableAccounts, search])

  const selectedAccountIndex = accounts.findIndex(
    (account) => account.addr === selectedAccount?.addr
  )

  const keyExtractor = useCallback((account: AccountType) => account.addr, [])

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 64,
      offset: 64 * index,
      index
    }),
    []
  )

  // Scrolls to the selected account in the FlatList
  // It's complexity comes from the fact that the FlatList is not mounted when the component is first rendered
  // and so are the accounts.
  const scrollToSelectedAccount = useCallback(
    (attempt: number = 0) => {
      const MAX_ATTEMPTS = 3
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (attempt > MAX_ATTEMPTS) {
        // Display the accounts after reaching MAX_ATTEMPTS
        setShouldDisplayAccounts(true)
        return
      }
      if (
        accounts.length &&
        selectedAccountIndex !== -1 &&
        flatlistRef?.current &&
        !shouldDisplayAccounts
      ) {
        try {
          flatlistRef.current.scrollToIndex({
            animated: false,
            index: selectedAccountIndex
          })
          setShouldDisplayAccounts(true)
        } catch (error) {
          console.warn(`Failed to scroll to the selected account. Attempt ${attempt}`, error)
          timeoutRef.current = setTimeout(() => scrollToSelectedAccount(attempt + 1), 100)
        }
      }
    },
    [accounts.length, flatlistRef, shouldDisplayAccounts, selectedAccountIndex]
  )

  useEffect(() => {
    scrollToSelectedAccount()
  }, [scrollToSelectedAccount])

  return {
    accounts: filteredAccounts,
    selectedAccountIndex,
    control,
    search,
    keyExtractor,
    getItemLayout,
    shouldDisplayAccounts
  }
}

export default useAccountsList
