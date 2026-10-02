import Fuse from 'fuse.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { FlatList, useWindowDimensions } from 'react-native'
import { isAddress } from 'viem'

import { Account as AccountType } from '@ambire-common/interfaces/account'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { getSearchableNames } from '@ambire-common/services/nameResolvers'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import {
  ACCOUNT_SELECT_ACCOUNT_HEIGHT,
  ACCOUNT_SELECT_ACCOUNT_MB
} from '@common/modules/account-select/components/Account/styles'

import getInitialScrollIndex from './getInitialScrollIndex'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const ITEM_HEIGHT = ACCOUNT_SELECT_ACCOUNT_HEIGHT + ACCOUNT_SELECT_ACCOUNT_MB

const SEARCH_DEBOUNCE_IN_MS = 350

const FUSE_KEYS = [
  { name: 'label', weight: 0.5 },
  { name: 'domainNames', weight: 0.3 },
  { name: 'address', weight: 0.1 },
  { name: 'keyLabels', weight: 0.2 },
  { name: 'smart', weight: 0.1 }
]

const FUSE_OPTIONS = {
  keys: FUSE_KEYS,
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
}

const selectDomains = (state: AllControllersMappingType['DomainsController']) => state.domains
const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys
const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account

/**
 * Powers the accounts list on the account select and the accounts settings screens.
 * Pass `flatlistRef` to also get the list positioned on the selected account from its
 * very first render - the caller then has to mount the list only once `isReadyToRender`
 * is true, because `initialScrollIndex` is read on the first mount alone.
 */
const useAccountsList = ({
  flatlistRef
}: {
  flatlistRef?: React.RefObject<FlatList<AccountType> | null>
} = {}) => {
  const { control, watch } = useForm({
    mode: 'all',
    defaultValues: {
      search: ''
    }
  })
  const search = watch('search')
  // The raw value drives the input so the caret stays instant, the debounced one drives
  // the filtering, which walks every account across five fields
  const debouncedSearch = useDebounce({ value: search, delay: SEARCH_DEBOUNCE_IN_MS })
  const [isListPositioned, setIsListPositioned] = useState(false)
  const { state: domains } = useController('DomainsController', selectDomains)
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: keys } = useController('KeystoreController', selectKeys)
  const { state: selectedAccount } = useController('SelectedAccountController', selectAccount)
  const { height: windowHeight } = useWindowDimensions()
  const prevSearchRef = useRef(debouncedSearch)

  const searchableAccounts = useMemo(
    () =>
      accounts.map((account) => ({
        account,
        label: account.preferences.label.toLowerCase(),
        keyLabels: keys
          .filter((key) => account.associatedKeys.includes(key.addr))
          .map((key) => `${key.label} ${key.type}`.toLowerCase())
          .join(' '),
        domainNames: getSearchableNames(domains[account.addr]?.names),
        address: account.addr.toLowerCase(),
        smart: isSmartAccount(account) ? 'smart' : ''
      })),
    [accounts, domains, keys]
  )

  // Indexing is the expensive half of Fuse and depends only on the list, so it is built
  // once per list rather than on every keystroke
  const fuse = useMemo(
    () =>
      new Fuse(searchableAccounts, FUSE_OPTIONS, Fuse.createIndex(FUSE_KEYS, searchableAccounts)),
    [searchableAccounts]
  )

  const filteredAccounts = useMemo(() => {
    if (!debouncedSearch) return accounts

    // Exact match if the search is an address
    if (isAddress(debouncedSearch)) {
      const account = accounts.find(
        (account) => account.addr.toLowerCase() === debouncedSearch.toLowerCase()
      )

      return account ? [account] : []
    }

    return fuse.search(debouncedSearch).map((result) => result.item.account)
  }, [accounts, fuse, debouncedSearch])

  // Against the filtered list, because that is what the FlatList is rendering
  const selectedAccountIndex = filteredAccounts.findIndex(
    (account) => account.addr === selectedAccount?.addr
  )

  const keyExtractor = useCallback((account: AccountType) => account.addr, [])

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index
    }),
    []
  )

  /**
   * `initialScrollIndex` only fixes which rows are rendered. react-native-web still
   * applies the scroll itself imperatively, from its own `onContentSizeChange`, so the
   * list is painted at the top for one frame before it lands on the selected account.
   * Our callback runs in that same commit, right after the scroll, which is the point
   * at which the list is safe to show.
   */
  const onListContentSizeChange = useCallback(() => setIsListPositioned(true), [])

  /**
   * Positions the list in its first commit, instead of rendering it from the top and
   * scrolling it afterwards (which leaves the rows now in the viewport blank until the
   * batching scheduler catches up). `getItemLayout` lets the list resolve the offset on
   * its own and clamp it to the content.
   */
  const initialScrollIndex = getInitialScrollIndex({
    selectedAccountIndex,
    accountsCount: filteredAccounts.length,
    itemHeight: ITEM_HEIGHT,
    windowHeight
  })

  // Scrolls to top on search
  useEffect(() => {
    if (prevSearchRef.current === debouncedSearch) return

    prevSearchRef.current = debouncedSearch
    flatlistRef?.current?.scrollToOffset({ animated: false, offset: 0 })
  }, [flatlistRef, debouncedSearch])

  return {
    accounts: filteredAccounts,
    selectedAccountIndex,
    control,
    search,
    keyExtractor,
    getItemLayout,
    onListContentSizeChange,
    initialScrollIndex,
    // Nothing to hide when the list starts at the top, so it shows right away
    shouldDisplayAccounts: initialScrollIndex === undefined || isListPositioned,
    // Gated on the unfiltered accounts so an empty search result still renders the
    // list (and with it the empty state) instead of unmounting it
    isReadyToRender: !flatlistRef || accounts.length > 0
  }
}

export default useAccountsList
