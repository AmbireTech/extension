import Fuse from 'fuse.js'
import { useMemo } from 'react'
import { isAddress } from 'viem'

import { getSearchableNames } from '@ambire-common/services/nameResolvers'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'

const useContactsSearch = (search: string) => {
  const { contacts } = useController('AddressBookController').state
  const {
    state: { domains }
  } = useController('DomainsController')

  const debouncedSearch = useDebounce({ value: search, delay: 350 })

  const searchableContacts = useMemo(
    () =>
      contacts.map((contact) => ({
        contact,
        name: contact.name.toLowerCase(),
        address: contact.address.toLowerCase(),
        domain: getSearchableNames(domains[contact.address]?.names)
      })),
    [contacts, domains]
  )

  const filteredContacts = useMemo(() => {
    if (!debouncedSearch) return contacts

    // Exact match if the search is an address
    if (isAddress(search)) {
      const contact = contacts.find(
        (contact) => contact.address.toLowerCase() === search.toLowerCase()
      )

      return contact ? [contact] : []
    }

    const fuse = new Fuse(searchableContacts, {
      keys: [
        { name: 'name', weight: 0.5 },
        { name: 'domain', weight: 0.3 },
        { name: 'address', weight: 0.2 }
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

    const results = fuse.search(debouncedSearch)
    return results.map((result) => result.item.contact)
  }, [contacts, debouncedSearch, search, searchableContacts])

  const walletAccountsSourcedContacts = useMemo(
    () => filteredContacts.filter((contact) => contact.isWalletAccount),
    [filteredContacts]
  )
  const manuallyAddedContacts = useMemo(
    () => filteredContacts.filter((contact) => !contact.isWalletAccount),
    [filteredContacts]
  )

  return {
    contacts,
    filteredContacts,
    walletAccountsSourcedContacts,
    manuallyAddedContacts
  }
}

export default useContactsSearch
