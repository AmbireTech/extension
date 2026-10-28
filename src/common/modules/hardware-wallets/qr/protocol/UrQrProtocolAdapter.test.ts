import { HDNodeWallet, Mnemonic } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  CryptoAccount,
  CryptoHDKey,
  CryptoKeypath,
  CryptoOutput,
  DataItem,
  encodeDataItem,
  PathComponent,
  ScriptExpressions
} from '@keystonehq/bc-ur-registry-eth'

import UrQrProtocolAdapter from './UrQrProtocolAdapter'

const MNEMONIC = 'test test test test test test test test test test test junk'
const MASTER_FINGERPRINT = '12345678'

const getNode = (path: string) => HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(MNEMONIC), path)
const toBuffer = (hex: string) => Buffer.from(hex.slice(2), 'hex')

/** `44'/60'/0'` in the shape the UR registry encodes paths in. */
const toKeypath = (path: string) =>
  new CryptoKeypath(
    path.split('/').map((level) => {
      const isHardened = level.endsWith("'")
      return new PathComponent({
        index: Number(isHardened ? level.slice(0, -1) : level),
        hardened: isHardened
      })
    }),
    Buffer.from(MASTER_FINGERPRINT, 'hex')
  )

/** What Keystone exports for Ledger Live - a public key per account, with no way to derive. */
const getLedgerLiveExport = (indices: number[]) =>
  new CryptoAccount(
    Buffer.from(MASTER_FINGERPRINT, 'hex'),
    indices.map(
      (index) =>
        new CryptoOutput(
          [ScriptExpressions.PUBLIC_KEY_HASH],
          new CryptoHDKey({
            isMaster: false,
            key: toBuffer(getNode(`m/44'/60'/${index}'/0/0`).publicKey),
            origin: toKeypath(`44'/60'/${index}'/0/0`),
            name: 'Keystone 3 Pro',
            note: 'account.ledger_live'
          })
        )
    )
  ).toCBOR()

/** What Keystone exports for the standard and Ledger Legacy paths - one account level key. */
const getAccountKeyExport = (childrenPath: '*' | '0/*', { withParentFingerprint = true } = {}) => {
  const accountNode = getNode("m/44'/60'/0'")

  return new CryptoHDKey({
    isMaster: false,
    key: toBuffer(accountNode.publicKey),
    chainCode: toBuffer(accountNode.chainCode),
    origin: toKeypath("44'/60'/0'"),
    children: new CryptoKeypath([
      ...(childrenPath === '0/*' ? [new PathComponent({ index: 0, hardened: false })] : []),
      new PathComponent({ hardened: false })
    ]),
    parentFingerprint: withParentFingerprint ? Buffer.from('aabbccdd', 'hex') : undefined,
    name: 'Keystone 3 Pro'
  }).toCBOR()
}

describe('UrQrProtocolAdapter.parseAccountPayload', () => {
  const adapter = new UrQrProtocolAdapter()

  it('reads each account of a Ledger Live export', async () => {
    const parsed = await adapter.parseAccountPayload(getLedgerLiveExport([0, 1]))

    expect(parsed).toEqual({
      deviceModel: 'Keystone 3 Pro',
      deviceId: MASTER_FINGERPRINT,
      masterFingerprint: MASTER_FINGERPRINT,
      accounts: [
        { addr: getNode("m/44'/60'/0'/0/0").address, hdPath: "m/44'/60'/0'/0/0" },
        { addr: getNode("m/44'/60'/1'/0/0").address, hdPath: "m/44'/60'/1'/0/0" }
      ]
    })
  })

  it('reads a Ledger Live export handed over as hex', async () => {
    const parsed = await adapter.parseAccountPayload(getLedgerLiveExport([0]).toString('hex'))

    expect(parsed.accounts).toEqual([
      { addr: getNode("m/44'/60'/0'/0/0").address, hdPath: "m/44'/60'/0'/0/0" }
    ])
  })

  it('still reads an account level key with the path it exported', async () => {
    const parsed = await adapter.parseAccountPayload(getAccountKeyExport('*'))

    expect(parsed).toMatchObject({
      deviceModel: 'Keystone 3 Pro',
      masterFingerprint: MASTER_FINGERPRINT,
      hdPath: "m/44'/60'/0'",
      childrenPath: '*',
      accounts: [{ index: 0, hdPath: "m/44'/60'/0'" }]
    })
    expect(HDNodeWallet.fromExtendedKey(parsed.accounts[0]!.xpub!).derivePath('0/1').address).toBe(
      getNode("m/44'/60'/0'/0/1").address
    )
  })

  it('reads an account level key exported without its parent fingerprint', async () => {
    const parsed = await adapter.parseAccountPayload(
      getAccountKeyExport('0/*', { withParentFingerprint: false })
    )

    expect(parsed.masterFingerprint).toBe(MASTER_FINGERPRINT)
  })

  it('refuses an export with no accounts in it', async () => {
    const emptyExport = new CryptoAccount(Buffer.from(MASTER_FINGERPRINT, 'hex'), []).toCBOR()

    await expect(adapter.parseAccountPayload(emptyExport)).rejects.toThrow(/No accounts/)
  })

  it('refuses a QR code that is not an account export', async () => {
    const notAnExport = encodeDataItem(new DataItem({ 1: 'something else' }))

    await expect(adapter.parseAccountPayload(notAnExport)).rejects.toThrow(
      /doesn't contain accounts Ambire can import/
    )
  })

  it('refuses a QR code holding a list rather than an account export', async () => {
    // Its third item being a list would otherwise pass for the accounts of a Ledger Live export
    const list = encodeDataItem(new DataItem(['a', 'b', ['c']]))

    await expect(adapter.parseAccountPayload(list)).rejects.toThrow(
      /doesn't contain accounts Ambire can import/
    )
  })

  it('explains a cut off QR code, keeping the reason for the crash report', async () => {
    const error = await adapter
      .parseAccountPayload(getLedgerLiveExport([0]).subarray(0, 20))
      .catch((e) => e)

    expect(error).toBeInstanceOf(ExternalSignerError)
    expect(error.message).toMatch(/couldn't read the accounts/)
    expect(error.sendCrashReport).toBe(true)
    expect(error.cause).toBeInstanceOf(Error)
  })
})
