import { ZeroAddress } from 'ethers'

import { getSafeTypedData } from '@ambire-common/libs/signMessage/signMessage'
import UrQrProtocolAdapter from '@common/modules/hardware-wallets/qr/protocol/UrQrProtocolAdapter'

import QrHardwareController from './QrHardwareController'

const getSafeTxTypedData = (dataBytes: number) =>
  getSafeTypedData(10n, '0xa60000000000000000000000000000000000ced5', {
    to: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE',
    value: '0x00',
    data: `0x${'ab'.repeat(dataBytes)}`,
    operation: 1,
    safeTxGas: '0x00',
    baseGas: '0x00',
    gasPrice: '0x00',
    gasToken: ZeroAddress as `0x${string}`,
    refundReceiver: ZeroAddress as `0x${string}`,
    nonce: '0x07'
  })

const getController = () =>
  new QrHardwareController(new UrQrProtocolAdapter(), {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    clear: jest.fn(),
    has: jest.fn(),
    values: jest.fn(() => [])
  } as any)

/**
 * Starts signing and returns the request the UI receives, serialized the way the
 * background sends controller state to it.
 */
const startSigningAndGetUiRequest = async (controller: QrHardwareController, dataBytes: number) => {
  controller
    .signTypedDataQR({
      typedData: getSafeTxTypedData(dataBytes),
      derivationPath: "m/44'/60'/0'/0/0",
      masterFingerprint: 'ffffffff',
      address: '0x0000000000000000000000000000000000000001'
    })
    // the session is cancelled below, which rejects the pending signature
    .catch(() => {})

  // wait for the request to be built and the session to start
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })

  return JSON.parse(JSON.stringify(controller)).currentRequest
}

describe('QrHardwareController - requests too large for the device', () => {
  it('passes the warning flag of a large Safe transaction to the UI', async () => {
    const controller = getController()

    expect((await startSigningAndGetUiRequest(controller, 3684)).isTooLargeForDevice).toBe(true)

    await controller.signingCleanup()
    expect(controller.currentRequest).toBe(null)
  })

  it('does not flag a small Safe transaction', async () => {
    const controller = getController()

    expect((await startSigningAndGetUiRequest(controller, 68)).isTooLargeForDevice).toBe(false)

    await controller.signingCleanup()
  })
})
