// The PQ1 commands Ambire uses, on top of the APDU transport in `hid.ts`.

import {
  INS_GET_DEVICE_INFO,
  INS_GET_INIT_CODE,
  INS_GET_STATUS,
  INS_GET_WALLET_ADDRESS,
  INS_OFFCHAIN_SYNC,
  INS_SIGN_OFFCHAIN,
  INS_SIGN_USEROP,
  INS_SIGN_USEROP_BATCH,
  INS_UNLOCK,
  isAccountIndex,
  isSlotIndex,
  MAX_TX_LEN,
  maxCallDataLen,
  OFFCHAIN_SYNC_INPUT_LEN,
  PQ_INIT_CODE_LEN,
  SW_CONDITIONS_NOT_SATISFIED,
  SW_INS_NOT_SUPPORTED,
  SW_INTERNAL_ERROR,
  SW_OK,
  SW_SECURITY_CONDITION,
  SW_SESSION_EXPIRED
} from '../config'
import { bytesToHex0x, concatBytes, u32be, u64be } from './bytes'
import { DeviceError, type HidTransport } from './hid'
import {
  buildSignOffchainPayload,
  parseSignOffchainResponse,
  type SignOffchainBundle,
  type SignOffchainParams
} from './offchain'
import {
  buildSignBatchPayload,
  buildSignPayload,
  type BatchSignRequestParams,
  type SignRequestParams
} from './signRequest'
import { parseSignResponse, type SignBundle } from './signResponse'

/** GET_STATUS reply. There is no `provisioned` flag: a device that isn't set
 *  up yet runs its first-boot wizard and answers gated commands with 0x6985. */
export type DeviceStatus = { locked: boolean; pinRemaining: number }

/** Wire layout of GET_STATUS: `[locked u8] [pin_remaining u8]`. Older
 *  firmware prefixed a meaningless `provisioned` byte, so a 3-byte reply is
 *  that legacy layout shifted by one. */
const STATUS_RESPONSE_LEN = 2
const LEGACY_STATUS_RESPONSE_LEN = 3

/** Lowest `protocol_version` (u16 BE in GET_DEVICE_INFO) that takes the
 *  SIGN_USEROP_BATCH payload Ambire sends. Older devices reject it with an
 *  opaque error, so the host refuses first with a clear one. */
const MIN_BATCH_V2_PROTOCOL_VERSION = 0x0200

/** Offset of the u32 BE capability word in the GET_DEVICE_INFO reply:
 *  after `protocol_version` (2), `fw_version` (3) and `device_uid` (16). */
const DEVICE_INFO_CAPABILITIES_OFF = 2 + 3 + 16

/** Typed wrappers for every PQ1 command the extension uses: status, unlock,
 *  address discovery, init code, and the UserOp / off-chain signing
 *  commands. Status words are turned into `DeviceError`s with a `code` the
 *  caller can recover from. */
export class DeviceCommands {
  /** `protocol_version` from the first GET_DEVICE_INFO; fixed per session. */
  private cachedProtocolVersion: number | null = null

  /** The capability word, read with the protocol version. */
  private cachedCapabilities: number | null = null

  /** GET_INIT_CODE results keyed by `${accountIndex}:${chainId}`. Every call
   *  spends one signature of the wallet's bootstrap key, a few-time
   *  signature scheme that weakens with each use, and the bytes never change,
   *  so they are asked for once per device handle. */
  private cachedInitCode = new Map<string, Uint8Array>()

  constructor(readonly t: HidTransport) {}

  /** The raw GET_DEVICE_INFO reply; caches the protocol version and the
   *  capability word on the way. */
  async getDeviceInfo(): Promise<Uint8Array> {
    const r = await this.t.sendApdu(INS_GET_DEVICE_INFO)
    expectOk(r.sw, 'GET_DEVICE_INFO')
    if (r.data.length >= 2 && this.cachedProtocolVersion === null) {
      this.cachedProtocolVersion = (r.data[0]! << 8) | r.data[1]!
    }
    if (this.cachedCapabilities === null) {
      this.cachedCapabilities = parseDeviceCapabilities(r.data)
    }
    return r.data
  }

  /** The device's capability bits (`CAP_*` in `../config`), fetched on
   *  first call and cached for the session. Firmware whose GET_DEVICE_INFO
   *  reply ends before the capability word reports none. Gate an optional
   *  command or payload kind on its bit, never on an error from trying it. */
  async getCapabilities(): Promise<number> {
    if (this.cachedCapabilities !== null) return this.cachedCapabilities
    await this.getDeviceInfo()
    return this.cachedCapabilities ?? 0
  }

  /** The device's wire-protocol version, fetched on first call and cached. */
  async getProtocolVersion(): Promise<number> {
    if (this.cachedProtocolVersion !== null) return this.cachedProtocolVersion
    await this.getDeviceInfo()
    if (this.cachedProtocolVersion === null) {
      throw new DeviceError('GET_DEVICE_INFO: response too short to read protocol_version')
    }
    return this.cachedProtocolVersion
  }

  /** Lock state and PIN attempts left. Works on a locked device. */
  async getStatus(): Promise<DeviceStatus> {
    const r = await this.t.sendApdu(INS_GET_STATUS)
    expectOk(r.sw, 'GET_STATUS')
    if (r.data.length < STATUS_RESPONSE_LEN) {
      throw new DeviceError(`GET_STATUS: response too short (${r.data.length} bytes)`)
    }
    const offset = r.data.length >= LEGACY_STATUS_RESPONSE_LEN ? 1 : 0
    return {
      locked: r.data[offset] === 1,
      pinRemaining: r.data[offset + 1]!
    }
  }

  /** Ask for the PIN on the device. Resolves with the status word once the
   *  user has entered it (or given up). */
  async unlock(): Promise<number> {
    const r = await this.t.sendApdu(INS_UNLOCK)
    return r.sw
  }

  /** Run a lock-gated command with SW_CONDITIONS_NOT_SATISFIED (0x6985)
   *  disambiguation. The firmware overloads 0x6985 for "device is locked",
   *  "not set up yet" (first-boot wizard still running), PIN lockout AND
   *  off-chain counter refusals — but GET_STATUS is ungated, so one status
   *  poll tells the lock state apart. Only when the device really reports
   *  `locked` do we rethrow a typed 'locked' error the caller can recover
   *  from by prompting for the on-device PIN; an unlocked refusal is
   *  reworded so the user knows to look at the device screen. */
  private async withLockDetection<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run()
    } catch (e) {
      if (!(e instanceof DeviceError) || e.sw !== SW_CONDITIONS_NOT_SATISFIED) throw e
      let status: DeviceStatus
      try {
        status = await this.getStatus()
      } catch (statusError) {
        // Status probe failed — keep the original error.
        console.warn('[pq1] GET_STATUS probe after a refusal failed', statusError)
        throw e
      }
      if (status.locked) {
        throw new DeviceError(
          'The PQ1 is locked (2-minute idle timeout). Unlock it with your PIN and retry.',
          e.sw,
          'locked'
        )
      }
      throw new DeviceError(
        'The PQ1 refused this request. If the device is showing its first-time setup, finish that on the device first; otherwise check the device screen for details.',
        e.sw,
        'refused'
      )
    }
  }

  /** Smart-wallet address of the device's account `accountIndex` (0-255).
   *  The firmware derives it locally from its seed, so it needs no network. */
  async getWalletAddress(accountIndex = 0): Promise<`0x${string}`> {
    if (!isAccountIndex(accountIndex)) {
      throw new DeviceError(`account_index out of range: ${accountIndex}`)
    }
    return this.withLockDetection(async () => {
      const r = await this.t.sendApdu(INS_GET_WALLET_ADDRESS, u32be(accountIndex))
      expectOk(r.sw, `GET_WALLET_ADDRESS(${accountIndex})`)
      if (r.data.length !== 20) throw new DeviceError(`unexpected address length ${r.data.length}`)
      return bytesToHex0x(r.data)
    })
  }

  /** The 4280-byte factory initCode for a not-yet-deployed wallet, used to
   *  estimate gas for its first deployment. Byte for byte what SIGN_USEROP
   *  returns when it deploys, so the estimate matches the final UserOp. The
   *  device doesn't ask the user to confirm this command. */
  async getInitCode(accountIndex: number, chainId: bigint | number): Promise<Uint8Array> {
    if (!isAccountIndex(accountIndex)) {
      throw new DeviceError(`account_index out of range: ${accountIndex}`)
    }
    const cacheKey = `${accountIndex}:${chainId}`
    const cached = this.cachedInitCode.get(cacheKey)
    if (cached) return cached

    const payload = concatBytes([u32be(accountIndex), u64be(chainId)])
    const initCode = await this.withLockDetection(async () => {
      const r = await this.t.sendApdu(INS_GET_INIT_CODE, payload)
      if (r.sw === SW_INS_NOT_SUPPORTED) {
        throw new DeviceError('GET_INIT_CODE: firmware does not expose this INS', r.sw, 'outdated')
      }
      expectOk(r.sw, 'GET_INIT_CODE')
      if (r.data.length !== PQ_INIT_CODE_LEN) {
        throw new DeviceError(
          `GET_INIT_CODE: expected ${PQ_INIT_CODE_LEN} bytes, got ${r.data.length}`
        )
      }
      return r.data
    })
    this.cachedInitCode.set(cacheKey, initCode)
    return initCode
  }

  /** The longest calldata of one call this device takes
   *  (`maxCallDataLen` of its capabilities). Throws an `outdated` error,
   *  before anything is sent, for a call that current firmware takes and
   *  this device's firmware doesn't: that firmware would refuse it with a
   *  generic error, so its capability bit is the only reliable signal. */
  private async callDataCapFor(calls: readonly { data?: Uint8Array }[]): Promise<number> {
    const cap = maxCallDataLen(await this.getCapabilities())
    const longest = Math.max(0, ...calls.map((call) => call.data?.length ?? 0))
    if (longest > cap && longest <= MAX_TX_LEN) {
      throw new DeviceError(
        `call data of ${longest} bytes needs firmware with CAP_SIGN_USEROP_DATA_8K; this device takes ${cap}`,
        undefined,
        'outdated'
      )
    }
    return cap
  }

  /** Sign a single-call UserOp after the user confirms it on the device. */
  async signUserOp(params: SignRequestParams): Promise<SignBundle> {
    const payload = buildSignPayload(params, await this.callDataCapFor([params]))
    return this.withLockDetection(async () => {
      const r = await this.t.sendChainedApdu(INS_SIGN_USEROP, payload)
      expectSignOk(r.sw, 'SIGN_USEROP')
      return parseSignResponse(r.data)
    })
  }

  /** Sign a UserOp of up to `MAX_BATCH_TXS` calls after the user confirms
   *  it on the device. */
  async signUserOpBatch(params: BatchSignRequestParams): Promise<SignBundle> {
    // Refuse older firmware before building the payload: it would reject the
    // payload with an opaque error.
    const protocolVersion = await this.getProtocolVersion()
    if (protocolVersion < MIN_BATCH_V2_PROTOCOL_VERSION) {
      throw new DeviceError(
        `PQ1 firmware too old for batch signing (protocol 0x${protocolVersion
          .toString(16)
          .padStart(4, '0')} < 0x${MIN_BATCH_V2_PROTOCOL_VERSION.toString(16).padStart(
          4,
          '0'
        )}). Update the device firmware to enable batched UserOps.`,
        undefined,
        'outdated'
      )
    }
    const payload = buildSignBatchPayload(params, await this.callDataCapFor(params.calls))
    return this.withLockDetection(async () => {
      const r = await this.t.sendChainedApdu(INS_SIGN_USEROP_BATCH, payload)
      expectSignOk(r.sw, 'SIGN_USEROP_BATCH')
      return parseSignResponse(r.data)
    })
  }

  /** Sign a message, typed data or a hash after the user confirms it on the
   *  device. */
  async signOffchain(params: SignOffchainParams): Promise<SignOffchainBundle> {
    const payload = buildSignOffchainPayload(params)
    return this.withLockDetection(async () => {
      const r = await this.t.sendChainedApdu(INS_SIGN_OFFCHAIN, payload)
      expectSignOk(r.sw, 'SIGN_OFFCHAIN')
      return parseSignOffchainResponse(r.data)
    })
  }

  /**
   * Raise the device's count of off-chain signatures for an owner slot to at
   * least `targetCount`; never lowers it. Ambire calls this with the wallet's
   * on-chain `offchainSigCount` before SIGN_USEROP, so the count the device
   * puts in the UserOp is never below the wallet's, even after a firmware
   * reflash wiped the device's own counters. A target at or below the
   * device's count returns at once; a higher one, or a new slot, waits for
   * the user to confirm "Update signature count?" on the device.
   */
  async offchainSync(input: {
    accountIndex: number
    chainId: bigint | number
    slotIndex: number
    targetCount: bigint
  }): Promise<void> {
    if (!isAccountIndex(input.accountIndex)) {
      throw new DeviceError(`offchainSync: account_index out of range: ${input.accountIndex}`)
    }
    if (!isSlotIndex(input.slotIndex)) {
      throw new DeviceError(`offchainSync: slot_index out of range: ${input.slotIndex}`)
    }
    const payload = concatBytes([
      new Uint8Array([input.accountIndex]),
      u64be(input.chainId),
      u32be(input.slotIndex),
      u64be(input.targetCount)
    ])
    if (payload.length !== OFFCHAIN_SYNC_INPUT_LEN) {
      throw new DeviceError(
        `offchainSync: payload length ${payload.length} != ${OFFCHAIN_SYNC_INPUT_LEN}`
      )
    }
    await this.withLockDetection(async () => {
      const r = await this.t.sendApdu(INS_OFFCHAIN_SYNC, payload)
      expectOk(r.sw, 'OFFCHAIN_SYNC')
    })
  }
}

/** The u32 BE capability word of a GET_DEVICE_INFO reply, or 0 when the
 *  reply is too short to carry one (older firmware). */
function parseDeviceCapabilities(info: Uint8Array): number {
  const off = DEVICE_INFO_CAPABILITIES_OFF
  if (info.length < off + 4) return 0
  return (
    ((info[off]! << 24) | (info[off + 1]! << 16) | (info[off + 2]! << 8) | info[off + 3]!) >>> 0
  )
}

function expectOk(sw: number, what: string): void {
  if (sw === SW_OK) return
  // 0x6982 = wrong PIN or rejected on the device — a deliberate decision,
  //          so it must never be retried automatically.
  // 0x6984 = the 2-minute idle timeout wiped the session while this command
  //          ran. Nothing was signed; entering the PIN again recovers.
  // 0x6985 is overloaded (locked / PIN lockout / off-chain refusals) and is
  //          told apart in `withLockDetection` with the ungated GET_STATUS.
  if (sw === SW_SECURITY_CONDITION) {
    throw new DeviceError(`${what}: rejected on the PQ1 (or PIN entry failed)`, sw, 'rejected')
  }
  if (sw === SW_SESSION_EXPIRED) {
    throw new DeviceError(
      `${what}: the PQ1 locked itself (2-minute idle timeout). Unlock it with your PIN and retry.`,
      sw,
      'locked'
    )
  }
  throw new DeviceError(`${what} failed: SW=0x${sw.toString(16).padStart(4, '0')}`, sw)
}

/** `expectOk` for the three sign commands. The firmware answers a request it
 *  won't sign because it can't show it in full (descriptor binding, render or
 *  page-budget gate, all fail-closed by design) with 0x6F00, after naming the
 *  reason on its screen. Nothing was signed, and unplugging the device would
 *  not help, so it gets its own code instead of the generic failure. */
function expectSignOk(sw: number, what: string): void {
  if (sw === SW_INTERNAL_ERROR) {
    throw new DeviceError(`${what}: the PQ1 refused to sign (SW=0x6f00)`, sw, 'sign-refused')
  }
  expectOk(sw, what)
}
