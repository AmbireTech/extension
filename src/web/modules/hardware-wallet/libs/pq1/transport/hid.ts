// WebHID transport for the PQ1: APDUs (the ISO 7816 command format Ledger
// also uses) split across 64-byte HID reports. The framing is the firmware's
// USB protocol (`docs/companion/usb-protocol-v2.md` in the firmware repo).

import {
  CHANNEL_ID,
  CLA_V2,
  INS_GET_RESPONSE,
  P1_LAST,
  P1_MORE,
  PQ1_PID,
  PQ1_VID,
  REPORT_SIZE,
  SW_OK,
  TAG_APDU,
  timeoutForIns
} from '../config'
import { concatBytes } from './bytes'

/** A device reply: its status word and data. */
export type ApduResponse = { sw: number; data: Uint8Array }

/** Machine-readable failure class so callers can recover instead of parsing
 *  message strings:
 *  - 'disconnected' — the HID handle is gone/stale (unplug, OS drop, closed).
 *    Recoverable by reconnecting via `HidTransport.connect()`.
 *  - 'locked' — the firmware idle-locked (2-minute timeout) or wiped the
 *    session mid-operation. Recoverable via INS_UNLOCK (on-device PIN).
 *  - 'rejected' — the user rejected on the device (or PIN entry failed).
 *    NOT auto-recoverable; never retry without the user asking.
 *  - 'timeout' — no HID report arrived in time; the device may be gone or
 *    the user ignored an on-device prompt.
 *  - 'refused' — the unlocked device refused the command (first-time setup
 *    still running, or a firmware policy check); the device screen says why.
 *  - 'outdated' — the firmware is too old for the requested command.
 *  - 'sign-refused' — the device refused to sign because it couldn't show
 *    the request in full; its screen names the reason. Never retried.
 *  - 'unsupported' — the browser has no WebHID (Firefox, Safari). */
export type DeviceErrorCode =
  | 'disconnected'
  | 'locked'
  | 'rejected'
  | 'timeout'
  | 'refused'
  | 'outdated'
  | 'sign-refused'
  | 'unsupported'

/** A failure of the device or the USB link. Errors without a `code` are
 *  unexpected (a malformed reply, a protocol mismatch). */
export class DeviceError extends Error {
  sw?: number

  code?: DeviceErrorCode

  constructor(msg: string, sw?: number, code?: DeviceErrorCode) {
    super(msg)
    this.name = 'DeviceError'
    this.sw = sw
    this.code = code
  }
}

/** Header of a message's first report: channel (2), tag (1), sequence (2),
 *  message length (2). Later reports omit the length. */
const FIRST_REPORT_HEADER_LEN = 7
const NEXT_REPORT_HEADER_LEN = 5
/** Longest data field of a short APDU. */
const MAX_APDU_DATA_LEN = 255
/** SW1 of a reply that has more data waiting for GET_RESPONSE. */
const SW1_MORE_DATA = 0x61

/** True when the browser has WebHID: Chromium-based browsers do, Firefox and
 *  Safari don't. Same check as `LedgerController.isSupported`. */
const isWebHidSupported = (): boolean =>
  typeof navigator !== 'undefined' && navigator !== null && 'hid' in navigator

type PendingReportReader = {
  resolve: (buf: Uint8Array) => void
  fail: (err: DeviceError) => void
}

/** One WebHID connection to a PQ1: opens the device, frames APDUs into
 *  64-byte HID reports and reassembles the replies (including GET_RESPONSE
 *  chaining). Higher-level commands live in `DeviceCommands`. */
export class HidTransport {
  device: HIDDevice | null = null

  /** Invoked once when the OS reports the device gone (unplug / port drop)
   *  while this transport holds it. The controller uses this to drop its
   *  stale `walletSDK` handle so the next operation reconnects cleanly. */
  onDisconnect?: () => void

  private pendingReportReaders: PendingReportReader[] = []

  /** The HIDDevice the `inputreport` listener is currently attached to —
   *  tracked per device (not a boolean) so a reconnect to a new HIDDevice
   *  object re-attaches correctly. */
  private listeningDevice: HIDDevice | null = null

  /** The tail of the exchange queue (see `exclusive`). */
  private lastExchange: Promise<unknown> = Promise.resolve()

  /** Open the PQ1: a device this extension was already granted (no user
   *  gesture needed, so it works from the background), else the browser's
   *  device picker. */
  async connect(): Promise<void> {
    if (!isWebHidSupported()) {
      throw new DeviceError('WebHID is not available in this browser', undefined, 'unsupported')
    }
    const filters: HIDDeviceFilter[] = [{ vendorId: PQ1_VID, productId: PQ1_PID }]
    const granted = await navigator.hid.getDevices()
    let device = granted.find((d) => d.vendorId === PQ1_VID && d.productId === PQ1_PID) ?? null
    if (!device) {
      // requestDevice needs a user gesture and a foreground document. In the
      // MV3 service worker (or when the user cancels the picker) it throws or
      // returns [] — normalize both to a typed 'disconnected' error so
      // callers can show a "plug it in and retry" message.
      try {
        const picked = await navigator.hid.requestDevice({ filters })
        device = picked[0] ?? null
      } catch (e) {
        console.warn('[pq1] WebHID device picker unavailable or dismissed', e)
        device = null
      }
    }
    if (!device) {
      throw new DeviceError(
        'No PQ1 device found. Plug it in via USB and retry.',
        undefined,
        'disconnected'
      )
    }
    if (!device.opened) await device.open()
    this.device = device
    this.attachListener()
    // The 'disconnect' event lives on navigator.hid (not the device), so it
    // fires even for handles the OS dropped without us calling close().
    navigator.hid.addEventListener('disconnect', this.onHidDisconnect)
  }

  /** Close the device and fail any read still waiting for it. */
  async disconnect(): Promise<void> {
    const device = this.device
    this.teardown(new DeviceError('PQ1 transport closed', undefined, 'disconnected'))
    if (device?.opened) {
      try {
        await device.close()
      } catch (e) {
        // The handle is already torn down above, so a failed close (the OS
        // dropped the device first) leaves nothing to clean up.
        console.warn('[pq1] closing the WebHID handle failed', e)
      }
    }
  }

  isConnected(): boolean {
    return this.device !== null && this.device.opened
  }

  /** Send one short APDU (`data` up to 255 bytes) and read the reply. */
  sendApdu(ins: number, data?: Uint8Array): Promise<ApduResponse> {
    return this.exclusive(async () => {
      await this.send(this.buildApdu(ins, P1_LAST, data))
      return this.receiveResponse(timeoutForIns(ins))
    })
  }

  /** Send `payload` as a chain of APDUs of up to 255 bytes (P1 = MORE for
   *  all but the last) and return the reply to the last one. The first reply
   *  that isn't OK ends the chain early and is returned instead. */
  sendChainedApdu(ins: number, payload: Uint8Array): Promise<ApduResponse> {
    return this.exclusive(async () => {
      const timeoutMs = timeoutForIns(ins)
      let offset = 0
      while (true) {
        const chunk = payload.subarray(offset, offset + MAX_APDU_DATA_LEN)
        offset += chunk.length
        const isLast = offset >= payload.length
        await this.send(this.buildApdu(ins, isLast ? P1_LAST : P1_MORE, chunk))
        const reply = await this.receiveResponse(timeoutMs)
        if (isLast || reply.sw !== SW_OK) return reply
      }
    })
  }

  /** The device handles one request at a time and its reports carry no
   *  request id, so two overlapping exchanges would read each other's
   *  replies. Each exchange starts once the previous one has finished. */
  private exclusive<T>(exchange: () => Promise<T>): Promise<T> {
    const result = this.lastExchange.then(exchange, exchange)
    // The caller gets this exchange's failure; the queue only waits for it.
    this.lastExchange = result.catch(() => undefined)
    return result
  }

  private onHidDisconnect = (e: HIDConnectionEvent): void => {
    if (!this.device || e.device !== this.device) return
    this.teardown(new DeviceError('PQ1 device was unplugged', undefined, 'disconnected'))
    this.onDisconnect?.()
  }

  /** Drop the device handle, detach listeners and fail any in-flight reads
   *  immediately — otherwise a read against a gone device would sit there
   *  until its full timeout (up to 120 s for sign commands). */
  private teardown(err: DeviceError): void {
    if (this.listeningDevice) {
      this.listeningDevice.removeEventListener('inputreport', this.onInputReport)
      this.listeningDevice = null
    }
    navigator.hid.removeEventListener('disconnect', this.onHidDisconnect)
    this.device = null
    const pending = this.pendingReportReaders.splice(0, this.pendingReportReaders.length)
    pending.forEach((p) => p.fail(err))
  }

  private attachListener(): void {
    if (!this.device || this.listeningDevice === this.device) return
    if (this.listeningDevice) {
      this.listeningDevice.removeEventListener('inputreport', this.onInputReport)
    }
    this.device.addEventListener('inputreport', this.onInputReport)
    this.listeningDevice = this.device
  }

  private onInputReport = (e: HIDInputReportEvent): void => {
    const buf = new Uint8Array(e.data.buffer, e.data.byteOffset, e.data.byteLength)
    const next = this.pendingReportReaders.shift()
    if (next) next.resolve(buf)
  }

  private readOneReport(timeoutMs: number): Promise<Uint8Array> {
    if (!this.device) {
      return Promise.reject(new DeviceError('PQ1 device not connected', undefined, 'disconnected'))
    }
    return new Promise<Uint8Array>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout>
      const reader: PendingReportReader = {
        resolve: (buf) => {
          clearTimeout(timer)
          resolve(buf)
        },
        fail: (err) => {
          clearTimeout(timer)
          reject(err)
        }
      }
      timer = setTimeout(() => {
        const idx = this.pendingReportReaders.indexOf(reader)
        if (idx >= 0) this.pendingReportReaders.splice(idx, 1)
        reject(new DeviceError(`HID read timeout after ${timeoutMs} ms`, undefined, 'timeout'))
      }, timeoutMs)
      this.pendingReportReaders.push(reader)
    })
  }

  /** Split an APDU into reports: `[channel][tag][seq]` on each, the total
   *  length on the first, then as much of the APDU as fits. */
  private frameApdu(apdu: Uint8Array): Uint8Array[] {
    const frames: Uint8Array[] = []
    let offset = 0
    let seq = 0
    do {
      const frame = new Uint8Array(REPORT_SIZE)
      frame.set([CHANNEL_ID >> 8, CHANNEL_ID & 0xff, TAG_APDU, seq >> 8, seq & 0xff])
      let headerLen = NEXT_REPORT_HEADER_LEN
      if (seq === 0) {
        frame.set([apdu.length >> 8, apdu.length & 0xff], NEXT_REPORT_HEADER_LEN)
        headerLen = FIRST_REPORT_HEADER_LEN
      }
      const chunk = apdu.subarray(offset, offset + REPORT_SIZE - headerLen)
      frame.set(chunk, headerLen)
      frames.push(frame)
      offset += chunk.length
      seq += 1
    } while (offset < apdu.length)
    return frames
  }

  /** Reassemble one message from its reports. The total length comes from
   *  the first report, so the buffer is allocated once — sign replies run to
   *  several kilobytes. */
  private async receiveApdu(timeoutMs: number): Promise<Uint8Array> {
    let buf = new Uint8Array(0)
    let received = 0
    let expected = 0
    let seq = 0

    while (true) {
      const r = await this.readOneReport(timeoutMs)
      if (r[2] !== TAG_APDU) continue
      const rSeq = ((r[3]! << 8) | r[4]!) & 0xffff
      if (rSeq !== seq) {
        throw new DeviceError(`HID sequence mismatch: expected ${seq}, got ${rSeq}`)
      }
      if (seq === 0) {
        expected = ((r[5]! << 8) | r[6]!) & 0xffff
        buf = new Uint8Array(expected)
        const c = Math.min(REPORT_SIZE - FIRST_REPORT_HEADER_LEN, expected)
        buf.set(r.subarray(FIRST_REPORT_HEADER_LEN, FIRST_REPORT_HEADER_LEN + c), 0)
        received = c
      } else {
        const c = Math.min(REPORT_SIZE - NEXT_REPORT_HEADER_LEN, expected - received)
        buf.set(r.subarray(NEXT_REPORT_HEADER_LEN, NEXT_REPORT_HEADER_LEN + c), received)
        received += c
      }
      seq++
      if (received >= expected) break
    }
    return buf
  }

  /** Read a reply, fetching the rest with GET_RESPONSE while the device
   *  answers `0x61xx` (more data waiting). */
  private async receiveResponse(timeoutMs: number): Promise<ApduResponse> {
    const parts: Uint8Array[] = []
    while (true) {
      const reply = await this.receiveApdu(timeoutMs)
      if (reply.length < 2) {
        throw new DeviceError(`reply shorter than a status word (${reply.length} bytes)`)
      }
      const sw = (reply[reply.length - 2]! << 8) | reply[reply.length - 1]!
      parts.push(reply.subarray(0, reply.length - 2))
      if (sw >> 8 !== SW1_MORE_DATA) return { sw, data: concatBytes(parts) }
      await this.send(this.buildApdu(INS_GET_RESPONSE, P1_LAST))
    }
  }

  private buildApdu(ins: number, p1: number, data?: Uint8Array): Uint8Array {
    const lc = data ? data.length : 0
    if (lc > MAX_APDU_DATA_LEN) throw new DeviceError(`short APDU Lc overflow: ${lc}`)
    const apdu = new Uint8Array(5 + lc)
    apdu.set([CLA_V2, ins, p1, 0x00, lc])
    if (lc && data) apdu.set(data, 5)
    return apdu
  }

  private async send(apdu: Uint8Array): Promise<void> {
    const { device } = this
    if (!device) {
      throw new DeviceError('PQ1 device not connected', undefined, 'disconnected')
    }

    for (const f of this.frameApdu(apdu)) {
      try {
        await device.sendReport(0, f as BufferSource)
      } catch (e) {
        // sendReport rejects with a raw DOMException when the handle is
        // stale (unplugged, or closed by the OS) — normalize it to a typed
        // 'disconnected' error so callers can reconnect instead of showing
        // a browser-internal message.
        throw new DeviceError(
          `PQ1 write failed — device disconnected? (${e instanceof Error ? e.message : String(e)})`,
          undefined,
          'disconnected'
        )
      }
    }
  }
}
