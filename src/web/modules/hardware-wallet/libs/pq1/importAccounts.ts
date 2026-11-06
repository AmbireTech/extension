import { getAddress } from 'ethers'

import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import { Account } from '@ambire-common/interfaces/account'
import { Key, Pq1ExternalKey } from '@ambire-common/interfaces/keystore'
import { getDefaultAccountPreferences } from '@ambire-common/libs/account/account'
import { getDefaultKeyLabel } from '@ambire-common/libs/keys/keys'

/**
 * Build the `Account` + `Pq1ExternalKey` records for PQ1 accounts already read
 * from the device (account number + address) by `PQ1Controller` for the
 * connect screen, which prepares them with the account picker's
 * `prepareAccounts` - nothing is written until the personalize step adds them.
 *
 * A PQ1 account is a smart contract wallet imported with `creation: null`, so
 * Ambire's account model treats it as a plain address. Its transactions go
 * through `PQ1Signer.broadcastAccountOp`, never through Ambire's relayer or
 * ERC-4337 flow. Names follow the account picker: "Account N" and "PQ1 Key 1",
 * and an account already in the wallet (e.g. added as view-only) keeps its own.
 */
export function buildPQ1AccountsToImport(
  entries: Array<{ accountIndex: number; addr: string }>,
  deviceId: string,
  existingAccounts: Account[]
): { accounts: Account[]; keys: Pq1ExternalKey[] } {
  const accounts: Account[] = []
  const keys: Pq1ExternalKey[] = []

  entries.forEach(({ accountIndex, addr: rawAddr }, i) => {
    const addr = getAddress(rawAddr)
    const alreadyImportedAccount = existingAccounts.find((account) => account.addr === addr)
    accounts.push({
      addr,
      associatedKeys: [addr],
      initialPrivileges: [],
      creation: null,
      preferences:
        alreadyImportedAccount?.preferences ||
        getDefaultAccountPreferences(addr, existingAccounts, i),
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
        // PQ1 has no HD derivation, so the key has no HD path: `index` is the
        // account number on the device (0-255), which `PQ1Signer` signs with.
        index: accountIndex,
        createdAt: Date.now()
      }
    })
  })

  return { accounts, keys }
}
