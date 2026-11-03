import { useCallback, useMemo } from 'react'

import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import { Hex } from '@ambire-common/interfaces/hex'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** An owner of a Safe about to be created, with what the wallet knows about it */
export type SafeOwnerDetails = {
  address: Hex
  /** The label of the matching wallet account or address book contact, if any */
  name?: string
  /** Where the owner comes from, e.g. "In this app", "Trezor" or "Address book" */
  source?: string
  /**
   * Whether the user can sign as this owner: for an account in the wallet, one of its keys is
   * in the keystore (for a smart account, those are not its address), else its address is
   */
  canSign: boolean
  /** Whether the owner is an account in the wallet, even a view-only one */
  isInWallet: boolean
}

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectContacts = (state: AllControllersMappingType['AddressBookController']) => state.contacts
const selectKeystoreKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

/**
 * Returns a function that describes a (would-be) Safe owner using the wallet's accounts,
 * keys and address book, so the Safe create screens show the owners the same way.
 */
const useSafeOwnerDetails = () => {
  const { t } = useTranslation()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: contacts } = useController('AddressBookController', selectContacts)
  const { state: keystoreKeys } = useController('KeystoreController', selectKeystoreKeys)

  const accountByAddress = useMemo(
    () => new Map(accounts.map((account) => [account.addr.toLowerCase(), account])),
    [accounts]
  )
  // The wallet's own accounts are contacts too, but they are already covered by the accounts
  const contactNameByAddress = useMemo(
    () =>
      new Map(
        contacts
          .filter(({ isWalletAccount }) => !isWalletAccount)
          .map((contact) => [contact.address.toLowerCase(), contact.name])
      ),
    [contacts]
  )
  const keysByAddress = useMemo(() => {
    const keys = new Map<string, typeof keystoreKeys>()
    keystoreKeys.forEach((key) => {
      const normalizedAddress = key.addr.toLowerCase()
      keys.set(normalizedAddress, [...(keys.get(normalizedAddress) || []), key])
    })
    return keys
  }, [keystoreKeys])

  return useCallback(
    (address: Hex): SafeOwnerDetails => {
      const normalizedAddress = address.toLowerCase()
      const account = accountByAddress.get(normalizedAddress)

      if (!account) {
        const contactName = contactNameByAddress.get(normalizedAddress)

        return {
          address,
          name: contactName,
          source: contactName ? t('Address book') : undefined,
          // Not an account in the wallet, so it signs only as a key itself
          canSign: keysByAddress.has(normalizedAddress),
          isInWallet: false
        }
      }

      // An account in the wallet signs with its own keys, which for a smart account
      // (incl. a Safe) are not its address
      const accountKeys = account.associatedKeys.flatMap(
        (keyAddress) => keysByAddress.get(keyAddress.toLowerCase()) || []
      )
      const hardwareKey = accountKeys.find((key) => key.type !== 'internal')
      const getSource = () => {
        if (accountKeys.some((key) => key.type === 'internal')) return t('In this app')
        if (hardwareKey && hardwareKey.type !== 'internal')
          return HARDWARE_WALLET_DEVICE_NAMES[hardwareKey.type]

        return t('In your wallet')
      }

      return {
        address,
        name: account.preferences.label,
        source: getSource(),
        canSign: !getIsViewOnly(keystoreKeys, account.associatedKeys),
        isInWallet: true
      }
    },
    [accountByAddress, contactNameByAddress, keysByAddress, keystoreKeys, t]
  )
}

export default useSafeOwnerDetails
