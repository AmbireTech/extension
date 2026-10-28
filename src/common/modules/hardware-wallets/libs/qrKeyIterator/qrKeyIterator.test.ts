import { HDNodeWallet, Mnemonic } from 'ethers'

import {
  BIP44_LEDGER_DERIVATION_TEMPLATE,
  BIP44_STANDARD_DERIVATION_TEMPLATE,
  LEGACY_POPULAR_DERIVATION_TEMPLATE
} from '@ambire-common/consts/derivation'
import { ParsedQrAccount } from '@ambire-common/interfaces/keystore'
import QrHardwareController from '@common/modules/hardware-wallets/controllers/QrHardwareController'

import QrKeyIterator from './qrKeyIterator'

const MNEMONIC = 'test test test test test test test test test test test junk'
const ACCOUNT_HD_PATH = "m/44'/60'/0'"

const getAddressAtPath = (path: string) =>
  HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(MNEMONIC), path).address

/** Initializes an iterator from what the QR controller parsed out of the scanned code. */
const getIteratorFromController = async (parsedAccount: Partial<ParsedQrAccount>) => {
  const controller = {
    parseAndSetAccountFromQR: async () => ({
      deviceModel: 'Keystone',
      deviceId: 'ffffffff',
      masterFingerprint: 'ffffffff',
      ...parsedAccount
    })
  } as unknown as QrHardwareController
  const keyIterator = new QrKeyIterator({ controller })

  await keyIterator.initFromQrPayload('00')

  return keyIterator
}

/**
 * Stands in for the wallet that was scanned - it hands over the extended public key of
 * `originHdPath`, which is all the iterator ever gets from a QR wallet.
 */
const getInitializedIterator = async (originHdPath: string, childrenPath?: string) => {
  const xpub = HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(MNEMONIC), originHdPath).neuter()
    .extendedKey

  return getIteratorFromController({
    hdPath: originHdPath,
    childrenPath,
    accounts: [{ xpub, index: 0, hdPath: originHdPath }]
  })
}

const getLedgerLivePath = (index: number) => `m/44'/60'/${index}'/0/0`
const getExportedAccount = (hdPath: string) => ({ addr: getAddressAtPath(hdPath), hdPath })
/**
 * Stands in for a wallet that exports its accounts one by one (as Keystone does for
 * Ledger Live), handing over the address and the path of each of them.
 */
const getIteratorFromExportedAccounts = (hdPaths: string[]) =>
  getIteratorFromController({ accounts: hdPaths.map(getExportedAccount) })

describe('QrKeyIterator', () => {
  it('derives the standard BIP44 addresses from an account level key', async () => {
    const keyIterator = await getInitializedIterator(ACCOUNT_HD_PATH)

    expect(keyIterator.hdPathTemplate).toBe(BIP44_STANDARD_DERIVATION_TEMPLATE)
    expect(await keyIterator.retrieve([{ from: 0, to: 1 }])).toEqual([
      getAddressAtPath(`${ACCOUNT_HD_PATH}/0/0`),
      getAddressAtPath(`${ACCOUNT_HD_PATH}/0/1`)
    ])
  })

  it('derives the Ledger Legacy addresses from the same account level key', async () => {
    const keyIterator = await getInitializedIterator(ACCOUNT_HD_PATH)

    expect(
      await keyIterator.retrieve([{ from: 0, to: 1 }], LEGACY_POPULAR_DERIVATION_TEMPLATE)
    ).toEqual([getAddressAtPath(`${ACCOUNT_HD_PATH}/0`), getAddressAtPath(`${ACCOUNT_HD_PATH}/1`)])
  })

  it('offers the standard and the legacy path for an account level key', async () => {
    const keyIterator = await getInitializedIterator(ACCOUNT_HD_PATH)

    expect(keyIterator.derivableHdPathTemplates).toEqual([
      BIP44_STANDARD_DERIVATION_TEMPLATE,
      LEGACY_POPULAR_DERIVATION_TEMPLATE
    ])
  })

  it('offers only the standard path for a key exported one level deeper', async () => {
    const keyIterator = await getInitializedIterator(`${ACCOUNT_HD_PATH}/0`)

    expect(keyIterator.hdPathTemplate).toBe(BIP44_STANDARD_DERIVATION_TEMPLATE)
    expect(keyIterator.derivableHdPathTemplates).toEqual([BIP44_STANDARD_DERIVATION_TEMPLATE])
    expect(await keyIterator.retrieve([{ from: 3, to: 3 }])).toEqual([
      getAddressAtPath(`${ACCOUNT_HD_PATH}/0/3`)
    ])
  })

  it('defaults to the path the wallet says it exported', async () => {
    const legacy = await getInitializedIterator(ACCOUNT_HD_PATH, '*')
    const standard = await getInitializedIterator(ACCOUNT_HD_PATH, '0/*')

    expect(legacy.hdPathTemplate).toBe(LEGACY_POPULAR_DERIVATION_TEMPLATE)
    expect(standard.hdPathTemplate).toBe(BIP44_STANDARD_DERIVATION_TEMPLATE)
    expect(await legacy.retrieve([{ from: 0, to: 0 }])).toEqual([
      getAddressAtPath(`${ACCOUNT_HD_PATH}/0`)
    ])
  })

  it('falls back to the standard path when the wallet does not say', async () => {
    const keyIterator = await getInitializedIterator(ACCOUNT_HD_PATH, undefined)

    expect(keyIterator.hdPathTemplate).toBe(BIP44_STANDARD_DERIVATION_TEMPLATE)
  })

  it('ignores a children path it cannot make a single index out of', async () => {
    const noWildcard = await getInitializedIterator(ACCOUNT_HD_PATH, '0/0')
    const twoWildcards = await getInitializedIterator(ACCOUNT_HD_PATH, '*/*')

    expect(noWildcard.hdPathTemplate).toBe(BIP44_STANDARD_DERIVATION_TEMPLATE)
    expect(twoWildcards.hdPathTemplate).toBe(BIP44_STANDARD_DERIVATION_TEMPLATE)
  })

  it('refuses a path the scanned key cannot reach', async () => {
    const keyIterator = await getInitializedIterator(ACCOUNT_HD_PATH)

    await expect(
      keyIterator.retrieve([{ from: 0, to: 0 }], BIP44_LEDGER_DERIVATION_TEMPLATE)
    ).rejects.toThrow(/cannot be browsed/)
  })

  describe('accounts exported one by one (Ledger Live)', () => {
    const LEDGER_LIVE_PATHS = [0, 1, 2].map(getLedgerLivePath)

    it('lists the exported accounts on the Ledger Live path', async () => {
      const keyIterator = await getIteratorFromExportedAccounts(LEDGER_LIVE_PATHS)

      expect(keyIterator.hdPathTemplate).toBe(BIP44_LEDGER_DERIVATION_TEMPLATE)
      expect(keyIterator.derivableHdPathTemplates).toEqual([BIP44_LEDGER_DERIVATION_TEMPLATE])
      expect(keyIterator.retrievableKeysCount).toBe(3)
      expect(await keyIterator.retrieve([{ from: 1, to: 2 }])).toEqual([
        getAddressAtPath(getLedgerLivePath(1)),
        getAddressAtPath(getLedgerLivePath(2))
      ])
    })

    it('lists the accounts by their index, whatever order they were exported in', async () => {
      const keyIterator = await getIteratorFromExportedAccounts([...LEDGER_LIVE_PATHS].reverse())

      expect(await keyIterator.retrieve([{ from: 0, to: 2 }])).toEqual(
        LEDGER_LIVE_PATHS.map(getAddressAtPath)
      )
    })

    it('comes up short on a page past the exported accounts', async () => {
      const keyIterator = await getIteratorFromExportedAccounts(LEDGER_LIVE_PATHS)

      expect(await keyIterator.retrieve([{ from: 0, to: 4 }])).toHaveLength(3)
      expect(await keyIterator.retrieve([{ from: 5, to: 9 }])).toEqual([])
    })

    it('refuses any other path', async () => {
      const keyIterator = await getIteratorFromExportedAccounts(LEDGER_LIVE_PATHS)

      await expect(
        keyIterator.retrieve([{ from: 0, to: 0 }], BIP44_STANDARD_DERIVATION_TEMPLATE)
      ).rejects.toThrow(/cannot be browsed/)
    })

    it('refuses invalid page ranges', async () => {
      const keyIterator = await getIteratorFromExportedAccounts(LEDGER_LIVE_PATHS)

      await expect(keyIterator.retrieve([{ from: undefined as any, to: 1 }])).rejects.toThrow(
        /invalid parameters/
      )
    })

    // Any of these would leave an account out or save it at an index it is not at
    it.each([
      ['the first account is missing', [1, 2].map(getLedgerLivePath)],
      ['an account is skipped', [0, 1, 3].map(getLedgerLivePath)],
      ['one account is on another path', [getLedgerLivePath(0), "m/44'/60'/0'/1"]],
      ['the path is not offered', ["m/44'/60'/0'/0'/0", "m/44'/60'/1'/0'/0"]]
    ])('refuses an export when %s', async (_: string, hdPaths: string[]) => {
      await expect(getIteratorFromExportedAccounts(hdPaths)).rejects.toThrow(
        /can't import the accounts/
      )
    })

    it('refuses an account without an address', async () => {
      await expect(
        getIteratorFromController({
          accounts: [getExportedAccount(getLedgerLivePath(0)), { hdPath: getLedgerLivePath(1) }]
        })
      ).rejects.toThrow(/can't import the accounts/)
    })

    it('refuses two accounts claiming the same path', async () => {
      await expect(
        getIteratorFromController({
          accounts: [
            ...LEDGER_LIVE_PATHS.map(getExportedAccount),
            { addr: getAddressAtPath("m/44'/60'/0'/0/9"), hdPath: getLedgerLivePath(1) }
          ]
        })
      ).rejects.toThrow(/more than one account/)
    })
  })
})
