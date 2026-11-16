import { useEffect, useMemo, useRef } from 'react'

import { Account, AccountStates } from '@ambire-common/interfaces/account'
import shortenAddress from '@ambire-common/utils/shortenAddress'
import { AccountKeyType } from '@common/components/AccountKey/AccountKey'
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

const isSameAddress = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * The details of a Safe owner: its full address, its account or contact
 * and the networks it is an owner on. When the
 * owner is a Safe of the wallet too, also its own signers and how many of them must sign.
 * Empty when the key is not of a Safe. Used only while the details are open, so the rows of a
 * closed list do not subscribe to the accounts, contacts and networks.
 */
const useSafeOwnerRows = (details: AccountKeyType, safeAccount?: Account): KeyDetailsRow[] => {
  const { t } = useTranslation()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: contacts } = useController('AddressBookController', selectContacts)
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { addr, onChains } = details

  const ownerAccount = useMemo(
    () => accounts.find((acc) => isSameAddress(acc.addr, addr)),
    [accounts, addr]
  )
  const ownerSafeAddr = safeAccount && ownerAccount?.safeCreation ? ownerAccount.addr : null
  const selectOwnerSafeStates = useMemo(
    () => (state: AllControllersMappingType['AccountsController']) =>
      ownerSafeAddr ? (state.accountStates?.[ownerSafeAddr] ?? null) : null,
    [ownerSafeAddr]
  )
  const { state: ownerSafeStates, dispatch: accountsDispatch } = useController(
    'AccountsController',
    selectOwnerSafeStates
  )

  // The signers of a Safe owner are read from its state, which may not be loaded yet
  const requestedOwnerSafeAddrRef = useRef<string | null>(null)
  useEffect(() => {
    if (!ownerSafeAddr || ownerSafeStates) return
    if (requestedOwnerSafeAddrRef.current === ownerSafeAddr) return

    requestedOwnerSafeAddrRef.current = ownerSafeAddr
    accountsDispatch({
      type: 'method',
      params: { method: 'updateAccountState', args: [ownerSafeAddr, 'latest'] }
    })
  }, [accountsDispatch, ownerSafeAddr, ownerSafeStates])

  return useMemo(() => {
    if (!safeAccount) return []

    const isOwner = (keyAddr: string) => isSameAddress(keyAddr, addr)
    const getName = (signerAddr: string) =>
      accounts.find((acc) => isSameAddress(acc.addr, signerAddr))?.preferences.label ||
      contacts.find((c) => isSameAddress(c.address, signerAddr))?.name ||
      shortenAddress(signerAddr, 13)
    const getNetworkName = (chainId: string) =>
      networks.find((n) => n.chainId.toString() === chainId)?.name || chainId

    // The wallet's own accounts are in the address book too, but they have the Account row
    const contact = contacts.find((c) => !c.isWalletAccount && isOwner(c.address))
    const ownerNetworkNames = networks
      .filter((n) => !!onChains?.includes(n.chainId))
      .map((n) => n.name)

    const rows: KeyDetailsRow[] = [{ key: t('Address'), value: addr }]
    if (ownerAccount) rows.push({ key: t('Account'), value: ownerAccount.preferences.label })
    if (contact) rows.push({ key: t('Contact'), value: contact.name })
    if (ownerNetworkNames.length)
      rows.push({ key: t('Owner on'), value: ownerNetworkNames.join(', ') })

    rows.push(...getOwnerSafeRows(ownerSafeStates, getName, getNetworkName, t))

    return rows
  }, [accounts, addr, contacts, networks, onChains, ownerAccount, ownerSafeStates, safeAccount, t])
}

/**
 * The signers of a Safe owner that is a Safe itself and how many of them must sign, from its
 * state on the networks it is deployed on. The signatures needed are told per network only when
 * they differ between networks.
 */
const getOwnerSafeRows = (
  ownerSafeStates: AccountStates[string] | null,
  getName: (signerAddr: string) => string,
  getNetworkName: (chainId: string) => string,
  t: (text: string, options?: Record<string, unknown>) => string
): KeyDetailsRow[] => {
  if (!ownerSafeStates) return []

  const deployedStates = Object.entries(ownerSafeStates).filter(([, state]) => state.isDeployed)
  if (!deployedStates.length) return []

  const signers = [...new Set(deployedStates.flatMap(([, state]) => state.associatedKeys))]
  const signaturesNeededByNetwork = deployedStates.map(([chainId, state]) => ({
    networkName: getNetworkName(chainId),
    signaturesNeeded: t('{{threshold}} of {{count}} signers', {
      threshold: state.threshold,
      count: state.associatedKeys.length
    })
  }))
  const distinctSignaturesNeeded = [
    ...new Set(signaturesNeededByNetwork.map(({ signaturesNeeded }) => signaturesNeeded))
  ]
  const signaturesNeeded =
    distinctSignaturesNeeded.length === 1
      ? distinctSignaturesNeeded.join('')
      : signaturesNeededByNetwork
          .map(({ networkName, signaturesNeeded: needed }) => `${networkName}: ${needed}`)
          .join(', ')

  return [
    { key: t('Signers'), value: signers.map(getName).join(', ') },
    { key: t('Signatures needed'), value: signaturesNeeded }
  ]
}

export default useSafeOwnerRows
