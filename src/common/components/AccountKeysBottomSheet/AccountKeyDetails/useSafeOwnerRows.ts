import { useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { AccountKeyType } from '@common/components/AccountKey/AccountKey'
import { KEY_TYPE_NAMES } from '@common/components/AccountKeysBadge/AccountKeysBadge'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** A row of the key details: a name and its value */
export type KeyDetailsRow = {
  key: string
  value: string
  tooltip?: string
  suffix?: string
}

const selectAccounts = (state: AllControllersMappingType['AccountsController']) =>
  state.accounts || []
const selectContacts = (state: AllControllersMappingType['AddressBookController']) =>
  state.contacts || []
const selectNetworks = (state: AllControllersMappingType['NetworksController']) =>
  state.networks || []

/**
 * The details of a Safe owner: its full address, its key in the wallet, its account or contact,
 * the networks it is an owner on and the other Safes of the wallet it can sign for.
 * Empty when the key is not of a Safe. Used only while the details are open, so the rows of a
 * closed list do not subscribe to the accounts, contacts and networks.
 */
const useSafeOwnerRows = (details: AccountKeyType, safeAccount?: Account): KeyDetailsRow[] => {
  const { t } = useTranslation()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: contacts } = useController('AddressBookController', selectContacts)
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { addr, type, isImported, onChains } = details

  return useMemo(() => {
    if (!safeAccount) return []

    const ownerAddr = addr.toLowerCase()
    const isOwner = (keyAddr: string) => keyAddr.toLowerCase() === ownerAddr
    const ownerAccount = accounts.find((acc) => isOwner(acc.addr))
    // The wallet's own accounts are in the address book too, but they have the Account row
    const contact = contacts.find((c) => !c.isWalletAccount && isOwner(c.address))
    const ownerNetworkNames = networks
      .filter((n) => !!onChains?.includes(n.chainId))
      .map((n) => n.name)
    const otherSafeLabels = accounts
      .filter(
        (acc) =>
          !!acc.safeCreation && acc.addr !== safeAccount.addr && acc.associatedKeys.some(isOwner)
      )
      .map((acc) => acc.preferences.label)

    const rows: KeyDetailsRow[] = [
      { key: t('Address'), value: addr },
      {
        key: t('Key in Ambire'),
        value: isImported && type ? t(KEY_TYPE_NAMES[type]) : t('Not imported')
      }
    ]
    if (ownerAccount) rows.push({ key: t('Account'), value: ownerAccount.preferences.label })
    if (contact) rows.push({ key: t('Contact'), value: contact.name })
    if (ownerNetworkNames.length)
      rows.push({ key: t('Owner on'), value: ownerNetworkNames.join(', ') })
    if (otherSafeLabels.length)
      rows.push({ key: t('Also owner of'), value: otherSafeLabels.join(', ') })

    return rows
  }, [accounts, addr, contacts, isImported, networks, onChains, safeAccount, t, type])
}

export default useSafeOwnerRows
