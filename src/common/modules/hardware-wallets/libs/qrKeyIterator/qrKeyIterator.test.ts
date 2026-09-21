import { HDNodeWallet, Mnemonic } from 'ethers'

import {
  BIP44_LEDGER_DERIVATION_TEMPLATE,
  BIP44_STANDARD_DERIVATION_TEMPLATE,
  LEGACY_POPULAR_DERIVATION_TEMPLATE
} from '@ambire-common/consts/derivation'
import QrHardwareController from '@common/modules/hardware-wallets/controllers/QrHardwareController'

import QrKeyIterator from './qrKeyIterator'

const MNEMONIC = 'test test test test test test test test test test test junk'
const ACCOUNT_HD_PATH = "m/44'/60'/0'"

const getAddressAtPath = (path: string) =>
  HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(MNEMONIC), path).address

/**
 * Stands in for the wallet that was scanned - it hands over the extended public key of
 * `originHdPath`, which is all the iterator ever gets from a QR wallet.
 */
const getInitializedIterator = async (originHdPath: string, childrenPath?: string) => {
  const xpub = HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(MNEMONIC), originHdPath).neuter()
    .extendedKey
  const controller = {
    parseAndSetAccountFromQR: async () => ({
      deviceModel: 'Keystone',
      deviceId: 'ffffffff',
      masterFingerprint: 'ffffffff',
      hdPath: originHdPath,
      childrenPath,
      accounts: [{ xpub, index: 0, hdPath: originHdPath }]
    })
  } as unknown as QrHardwareController
  const keyIterator = new QrKeyIterator({ controller })

  await keyIterator.initFromQrPayload('00')

  return keyIterator
}

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
})
