import { getAddress } from 'ethers'

import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import { Account } from '@ambire-common/interfaces/account'
import { ExternalKey, Key } from '@ambire-common/interfaces/keystore'
import { getDefaultAccountPreferences } from '@ambire-common/libs/account/account'
import { getDefaultKeyLabel } from '@ambire-common/libs/keys/keys'

/**
 * Build the `Account` + `ExternalKey` records for PQ1 accounts the connect
 * screen has already read from the device (account number + address).
 *
 * The screen talks to the device itself: granting the browser's permission
 * to use it needs a user gesture, which only a page has. The background just
 * writes these records.
 *
 * A PQ1 account is a smart contract wallet imported with `creation: null`, so
 * Ambire's account model treats it as a plain address. Its transactions go
 * through `PQ1Signer.broadcastAccountOp`, never through Ambire's relayer or
 * ERC-4337 flow. Names follow the account picker: "Account N" and "PQ1 Key 1".
 */
export function buildPQ1AccountsToImport(
  entries: Array<{ accountIndex: number; addr: string }>,
  deviceId: string,
  existingAccounts: Account[]
): { accounts: Account[]; keys: ExternalKey[] } {
  const accounts: Account[] = []
  const keys: ExternalKey[] = []

  entries.forEach(({ accountIndex, addr: rawAddr }, i) => {
    const addr = getAddress(rawAddr)
    accounts.push({
      addr,
      associatedKeys: [addr],
      initialPrivileges: [],
      creation: null,
      preferences: getDefaultAccountPreferences(addr, existingAccounts, i),
      newlyAdded: true
    })
    // Each PQ1 account is controlled by exactly one key: its own.
    const noOtherKeysOfThisAccount: Key[] = []
    keys.push({
      addr,
      type: 'pq1',
      label: `${HARDWARE_WALLET_DEVICE_NAMES.pq1} ${getDefaultKeyLabel(noOtherKeysOfThisAccount, 0)}`,
      dedicatedToOneSA: false,
      meta: {
        deviceId,
        deviceModel: 'pq1',
        // PQ1 has no HD derivation: `index` is the account number on the
        // device (0-255), which `PQ1Signer` signs with. The keystore type
        // requires a template, so the standard one is stored; the key details
        // screen doesn't show an HD path for PQ1 keys.
        hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,
        index: accountIndex,
        createdAt: Date.now()
      }
    })
  })

  return { accounts, keys }
}
