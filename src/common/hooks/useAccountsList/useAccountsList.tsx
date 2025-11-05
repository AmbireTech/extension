import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FlatList } from 'react-native'

import { Account as AccountType } from '@ambire-common/interfaces/account'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { findAccountDomainFromPartialDomain } from '@ambire-common/utils/domains'
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

  const filteredAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        if (!search) return true

        const normalizedSearch = search.toLowerCase().trim()
        const allWords = normalizedSearch.split(/\s+/).filter((word) => word.length > 0)
        if (!allWords.length) return false

        // Prevent overly broad matches from short words in multi-word queries
        // (e.g., "elmo a" shouldn't match everything "a"), while still allowing
        // partial single-word searches as users type (to prevent "no results" at first)
        const searchWords =
          allWords.length === 1
            ? allWords
            : allWords.some((w) => w.length > 3)
            ? allWords.filter((w) => w.length >= 3)
            : allWords
        if (!searchWords.length) return false

        const doesAddressMatch = searchWords.some((word) =>
          account.addr.toLowerCase().includes(word)
        )
        const doesDomainMatch = findAccountDomainFromPartialDomain(account.addr, search, domains)
        const doesLabelMatch = searchWords.some((word) =>
          account.preferences.label.toLowerCase().includes(word)
        )
        const doesSmartAccountMatch =
          isSmartAccount(account) && searchWords.some((word) => word === 'smart')

        return doesAddressMatch || doesLabelMatch || doesSmartAccountMatch || doesDomainMatch
      }),
    [accounts, domains, search]
  )

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
