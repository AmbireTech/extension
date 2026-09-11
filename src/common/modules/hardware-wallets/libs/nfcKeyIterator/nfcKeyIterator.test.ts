import { HDNodeWallet, Mnemonic } from 'ethers'

import {
  BIP44_LEDGER_DERIVATION_TEMPLATE,
  BIP44_STANDARD_DERIVATION_TEMPLATE,
  LEGACY_POPULAR_DERIVATION_TEMPLATE
} from '@ambire-common/consts/derivation'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'

import NfcKeyIterator from './nfcKeyIterator'

const MNEMONIC = 'test test test test test test test test test test test junk'
const ACCOUNT_HD_PATH = "m/44'/60'/0'"
const KEY_UID = 'a1b2c3'

const getAccountNode = () =>
  HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(MNEMONIC), ACCOUNT_HD_PATH)

const getExpectedAddress = (index: number) =>
  HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(MNEMONIC), `${ACCOUNT_HD_PATH}/0/${index}`).address

const getExpectedLegacyAddress = (index: number) =>
  HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(MNEMONIC), `${ACCOUNT_HD_PATH}/${index}`).address

const getController = () =>
  ({ type: 'nfc', deviceId: '', deviceModel: '' }) as ExternalSignerController

const getInitializedIterator = () => {
  const controller = getController()
  const keyIterator = new NfcKeyIterator({ controller })

  keyIterator.initFromExportedKey({
    // The card exports the account-level extended public key, which is what
    // `neuter()` produces here (public key + chain code, no private key).
    extendedPublicKey: getAccountNode().neuter().extendedKey,
    hdPath: ACCOUNT_HD_PATH,
    keyUid: KEY_UID,
    nfcWalletType: 'keycard'
  })

  return { keyIterator, controller }
}

describe('NfcKeyIterator', () => {
  it('derives the same addresses as standard BIP44 derivation from the seed', async () => {
    const { keyIterator } = getInitializedIterator()

    const addresses = await keyIterator.retrieve([{ from: 0, to: 4 }])

    expect(addresses).toEqual([0, 1, 2, 3, 4].map(getExpectedAddress))
  })

  it('derives non-zero-based and multiple ranges', async () => {
    const { keyIterator } = getInitializedIterator()

    const addresses = await keyIterator.retrieve([
      { from: 5, to: 6 },
      { from: 42, to: 42 }
    ])

    expect(addresses).toEqual([
      getExpectedAddress(5),
      getExpectedAddress(6),
      getExpectedAddress(42)
    ])
  })

  it('derives the Ledger Legacy addresses from the same card key', async () => {
    const { keyIterator } = getInitializedIterator()

    const addresses = await keyIterator.retrieve(
      [{ from: 0, to: 2 }],
      LEGACY_POPULAR_DERIVATION_TEMPLATE
    )

    expect(addresses).toEqual([0, 1, 2].map(getExpectedLegacyAddress))
  })

  it('offers the standard and the legacy path only', () => {
    const { keyIterator } = getInitializedIterator()

    expect(keyIterator.derivableHdPathTemplates).toEqual([
      BIP44_STANDARD_DERIVATION_TEMPLATE,
      LEGACY_POPULAR_DERIVATION_TEMPLATE
    ])
  })

  it('refuses a path the card key cannot reach', async () => {
    const { keyIterator } = getInitializedIterator()

    await expect(
      keyIterator.retrieve([{ from: 0, to: 0 }], BIP44_LEDGER_DERIVATION_TEMPLATE)
    ).rejects.toThrow(/cannot be browsed/)
  })

  it('uses the standard BIP44 template and records which card the accounts came from', () => {
    const { keyIterator, controller } = getInitializedIterator()

    expect(keyIterator.hdPathTemplate).toBe(BIP44_STANDARD_DERIVATION_TEMPLATE)
    expect(keyIterator.type).toBe('nfc')
    expect(controller.deviceId).toBe(KEY_UID)
    expect(controller.nfcWalletType).toBe('keycard')
    expect(controller.deviceModel).toBe('Keycard')
  })

  it('refuses an account key exported from an unexpected path', () => {
    const keyIterator = new NfcKeyIterator({ controller: getController() })

    expect(() =>
      keyIterator.initFromExportedKey({
        extendedPublicKey: getAccountNode().neuter().extendedKey,
        hdPath: "m/44'/1'/0'",
        keyUid: KEY_UID,
        nfcWalletType: 'keycard'
      })
    ).toThrow(/Unsupported account path/)
  })

  it('refuses an empty account key', () => {
    const keyIterator = new NfcKeyIterator({ controller: getController() })

    expect(() =>
      keyIterator.initFromExportedKey({
        extendedPublicKey: '',
        hdPath: ACCOUNT_HD_PATH,
        keyUid: KEY_UID,
        nfcWalletType: 'keycard'
      })
    ).toThrow(/did not return an account key/)
  })

  it('does not derive addresses before the card key was exported', async () => {
    const keyIterator = new NfcKeyIterator({ controller: getController() })

    await expect(keyIterator.retrieve([{ from: 0, to: 0 }])).rejects.toThrow(
      /card account key is missing/
    )
  })
})
