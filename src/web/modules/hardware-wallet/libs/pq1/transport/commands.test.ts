// GET_STATUS wire-layout tests. The firmware dropped the leading
// `provisioned` byte (it was a constant 1, even on a blank device), so the
// current reply is `[locked u8] [pin_remaining u8]`; older
// firmware still answers with the 3-byte layout. Both must parse, and the
// 0x6985 disambiguation in `withLockDetection` must lean on the parsed
// lock state.

import {
  CAP_OFFCHAIN_COW_ORDER,
  CAP_OFFCHAIN_SAFE_TX,
  INS_GET_DEVICE_INFO,
  INS_GET_INIT_CODE,
  INS_GET_STATUS,
  INS_GET_WALLET_ADDRESS,
  INS_OFFCHAIN_SYNC,
  INS_SIGN_USEROP,
  PQ_INIT_CODE_LEN,
  SW_CONDITIONS_NOT_SATISFIED,
  SW_INTERNAL_ERROR,
  SW_OK,
  timeoutForIns
} from '../config'
import { DeviceCommands } from './commands'
import { DeviceError, type ApduResponse, type HidTransport } from './hid'

/** Minimal HidTransport stand-in: answers each INS from a fixed table and
 *  counts how often each INS was sent. */
function stubTransport(
  replies: Record<number, ApduResponse>,
  sent: Record<number, number> = {}
): HidTransport {
  return {
    sendApdu: async (ins: number) => {
      sent[ins] = (sent[ins] ?? 0) + 1
      const reply = replies[ins]
      if (!reply) throw new Error(`unexpected INS 0x${ins.toString(16)}`)
      return reply
    }
  } as unknown as HidTransport
}

describe('DeviceCommands.getStatus', () => {
  it('parses the current 2-byte layout [locked, pin_remaining]', async () => {
    const commands = new DeviceCommands(
      stubTransport({ [INS_GET_STATUS]: { sw: SW_OK, data: new Uint8Array([1, 7]) } })
    )
    await expect(commands.getStatus()).resolves.toEqual({ locked: true, pinRemaining: 7 })
  })

  it('reports unlocked when the first byte is 0', async () => {
    const commands = new DeviceCommands(
      stubTransport({ [INS_GET_STATUS]: { sw: SW_OK, data: new Uint8Array([0, 10]) } })
    )
    await expect(commands.getStatus()).resolves.toEqual({ locked: false, pinRemaining: 10 })
  })

  it('accepts the legacy 3-byte layout by skipping the provisioned byte', async () => {
    const commands = new DeviceCommands(
      stubTransport({ [INS_GET_STATUS]: { sw: SW_OK, data: new Uint8Array([1, 1, 3]) } })
    )
    await expect(commands.getStatus()).resolves.toEqual({ locked: true, pinRemaining: 3 })
  })

  it('rejects a reply shorter than 2 bytes', async () => {
    const commands = new DeviceCommands(
      stubTransport({ [INS_GET_STATUS]: { sw: SW_OK, data: new Uint8Array([1]) } })
    )
    await expect(commands.getStatus()).rejects.toThrow('GET_STATUS: response too short')
  })
})

describe('DeviceCommands lock detection on 0x6985', () => {
  it('surfaces a typed locked error when GET_STATUS reports locked', async () => {
    const commands = new DeviceCommands(
      stubTransport({
        [INS_GET_WALLET_ADDRESS]: { sw: SW_CONDITIONS_NOT_SATISFIED, data: new Uint8Array() },
        [INS_GET_STATUS]: { sw: SW_OK, data: new Uint8Array([1, 9]) }
      })
    )
    const err = await commands.getWalletAddress(0).catch((e) => e)
    expect(err).toBeInstanceOf(DeviceError)
    expect(err.code).toBe('locked')
    expect(err.sw).toBe(SW_CONDITIONS_NOT_SATISFIED)
  })

  it('points the user at the device screen when refused while unlocked', async () => {
    const commands = new DeviceCommands(
      stubTransport({
        [INS_GET_WALLET_ADDRESS]: { sw: SW_CONDITIONS_NOT_SATISFIED, data: new Uint8Array() },
        [INS_GET_STATUS]: { sw: SW_OK, data: new Uint8Array([0, 9]) }
      })
    )
    const err = await commands.getWalletAddress(0).catch((e) => e)
    expect(err).toBeInstanceOf(DeviceError)
    expect(err.code).toBe('refused')
    expect(err.message).toContain('first-time setup')
  })
})

describe('DeviceCommands sign refusals on 0x6F00', () => {
  it('reports a device-side refusal to sign, not a transport failure', async () => {
    const transport = {
      sendChainedApdu: async () => ({ sw: SW_INTERNAL_ERROR, data: new Uint8Array() })
    } as unknown as HidTransport
    const commands = new DeviceCommands(transport)
    const err = await commands
      .signOffchain({
        kind: 'raw32',
        digest: new Uint8Array(32),
        accountIndex: 0,
        chainId: 1,
        slotIndex: 0,
        accountDeployed: true
      })
      .catch((e) => e)
    expect(err).toBeInstanceOf(DeviceError)
    expect(err.code).toBe('sign-refused')
    expect(err.sw).toBe(SW_INTERNAL_ERROR)
  })
})

describe('DeviceCommands.getInitCode', () => {
  it('asks the device once per (account, chain) and serves repeats from cache', async () => {
    const sent: Record<number, number> = {}
    const initCode = new Uint8Array(PQ_INIT_CODE_LEN).fill(0xab)
    const commands = new DeviceCommands(
      stubTransport({ [INS_GET_INIT_CODE]: { sw: SW_OK, data: initCode } }, sent)
    )

    await expect(commands.getInitCode(0, 8453)).resolves.toBe(initCode)
    await expect(commands.getInitCode(0, 8453)).resolves.toBe(initCode)
    expect(sent[INS_GET_INIT_CODE]).toBe(1)

    await commands.getInitCode(0, 1)
    await commands.getInitCode(1, 8453)
    expect(sent[INS_GET_INIT_CODE]).toBe(3)
  })

  it('rejects a reply of the wrong length without caching it', async () => {
    const sent: Record<number, number> = {}
    const commands = new DeviceCommands(
      stubTransport({ [INS_GET_INIT_CODE]: { sw: SW_OK, data: new Uint8Array(10) } }, sent)
    )
    await expect(commands.getInitCode(0, 8453)).rejects.toThrow('GET_INIT_CODE: expected')
    await expect(commands.getInitCode(0, 8453)).rejects.toThrow('GET_INIT_CODE: expected')
    expect(sent[INS_GET_INIT_CODE]).toBe(2)
  })
})

describe('DeviceCommands.getCapabilities', () => {
  /** GET_DEVICE_INFO: protocol_version (2) || fw_version (3) || uid (16) ||
   *  capabilities (u32 BE) || sig_param_set ... */
  const deviceInfo = (caps: number | null) => {
    const out = new Uint8Array(caps === null ? 21 : 26)
    out.set([0x02, 0x03], 0)
    if (caps !== null)
      out.set([caps >>> 24, (caps >>> 16) & 0xff, (caps >>> 8) & 0xff, caps & 0xff], 21)
    return out
  }

  it('reads the capability word and caches it', async () => {
    const sent: Record<number, number> = {}
    const caps = 0x01 | CAP_OFFCHAIN_SAFE_TX | CAP_OFFCHAIN_COW_ORDER
    const commands = new DeviceCommands(
      stubTransport({ [INS_GET_DEVICE_INFO]: { sw: SW_OK, data: deviceInfo(caps) } }, sent)
    )
    expect(await commands.getCapabilities()).toBe(caps)
    expect(await commands.getCapabilities()).toBe(caps)
    expect(await commands.getProtocolVersion()).toBe(0x0203)
    expect(sent[INS_GET_DEVICE_INFO]).toBe(1)
  })

  it('reports no capabilities when the reply ends before the word', async () => {
    const commands = new DeviceCommands(
      stubTransport({ [INS_GET_DEVICE_INFO]: { sw: SW_OK, data: deviceInfo(null) } })
    )
    expect(await commands.getCapabilities()).toBe(0)
  })
})

describe('timeoutForIns', () => {
  it('waits as long for a signature-count update as for a signature: both can wait for the user', () => {
    expect(timeoutForIns(INS_OFFCHAIN_SYNC)).toBe(timeoutForIns(INS_SIGN_USEROP))
  })
})
