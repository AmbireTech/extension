import { HDNodeVoidWallet, HDNodeWallet } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { ParsedQrAccount, ParsedQrImportedAccount } from '@ambire-common/interfaces/keystore'

type DeriveAddressesFromParsedQrAccountArgs = {
  parsedAccount: ParsedQrAccount
  /**
   * Relative path from the imported xpub node to the final address node.
   * Example: "0/{index}"
   */
  relativePathTemplate?: string
}

function buildRelativePath(template: string, index: number) {
  return template.replace('{index}', String(index))
}

function deriveAddressFromXpub(xpub: string, relativePath: string): string {
  const node = HDNodeWallet.fromExtendedKey(xpub)

  // In some ethers versions, xpub yields HDNodeVoidWallet instead of HDNodeWallet.
  // Both support derivePath/address for public derivation.
  const derived = node.derivePath(relativePath) as HDNodeWallet | HDNodeVoidWallet

  return derived.address
}

export function deriveAddressesFromParsedQrAccount({
  parsedAccount,
  relativePathTemplate = '0/{index}'
}: DeriveAddressesFromParsedQrAccountArgs): ParsedQrAccount {
  try {
    return {
      ...parsedAccount,
      accounts: parsedAccount.accounts.map(
        (account: ParsedQrImportedAccount, fallbackIndex: number) => {
          if (account.addr) return account

          if (!account.xpub) {
            throw new ExternalSignerError(
              `QR imported account at index ${fallbackIndex} is missing both addr and xpub`
            )
          }

          const index = account.index ?? fallbackIndex
          const relativePath = buildRelativePath(relativePathTemplate, index)
          const addr = deriveAddressFromXpub(account.xpub, relativePath)

          return {
            ...account,
            addr,
            hdPath:
              account.hdPath || `${parsedAccount.hdPath || ''}/${relativePath}`.replace(/^\/+/, '')
          }
        }
      )
    }
  } catch (e: any) {
    throw new ExternalSignerError(
      e?.message || 'Failed to derive Ethereum addresses from QR imported xpub.',
      { sendCrashReport: true }
    )
  }
}
