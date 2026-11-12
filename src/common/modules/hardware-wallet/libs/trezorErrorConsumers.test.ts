import { describe, expect, jest, test } from '@jest/globals'

import {
  BIP44_LEDGER_DERIVATION_TEMPLATE,
  BIP44_STANDARD_DERIVATION_TEMPLATE
} from '@ambire-common/consts/derivation'
import { ExternalKey } from '@ambire-common/interfaces/keystore'

import TrezorSigner from './TrezorSigner/TrezorSigner'
import TrezorKeyIterator from './trezorKeyIterator/trezorKeyIterator'

jest.mock('@ambire-common/utils/wait', () => ({
  __esModule: true,
  default: async () => {}
}))
jest.mock('@trezor/connect-plugin-ethereum', () => ({
  __esModule: true,
  default: jest.fn()
}))

const key: ExternalKey = {
  addr: '0x1111111111111111111111111111111111111111',
  type: 'trezor',
  label: 'Trezor',
  dedicatedToOneSA: false,
  meta: {
    deviceId: 'device-id',
    deviceModel: 'Safe 5',
    hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,
    index: 0,
    createdAt: 1
  }
}

describe.each([
  ['v9', { success: false, payload: { code: 'Device_Disconnected', error: 'Disconnected' } }],
  ['v10', { success: false, error: { code: 'Device_Disconnected', message: 'Disconnected' } }]
])('Trezor %s error consumers', (_version, failure) => {
  test('humanizes a signing failure', async () => {
    const signer = new TrezorSigner(key)
    signer.init({
      isInitiated: true,
      initialLoadPromise: Promise.resolve(),
      walletSDK: { ethereumSignMessage: jest.fn(async () => failure) }
    } as any)

    await expect(signer.signMessage('0x01')).rejects.toThrow('Trezor device got disconnected.')
  })

  test.each([BIP44_STANDARD_DERIVATION_TEMPLATE, BIP44_LEDGER_DERIVATION_TEMPLATE] as const)(
    'humanizes public-key retrieval failures for %s',
    async (hdPathTemplate) => {
      const iterator = new TrezorKeyIterator({
        walletSDK: { ethereumGetPublicKey: jest.fn(async () => failure) } as any
      })

      await expect(iterator.retrieve([{ from: 0, to: 0 }], hdPathTemplate)).rejects.toThrow(
        'Trezor device got disconnected.'
      )
    }
  )
})
