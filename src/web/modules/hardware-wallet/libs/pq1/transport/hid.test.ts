// HidTransport against a fake WebHID device that speaks the PQ1 framing:
// 64-byte reports, APDUs split across them, `0x61xx` answered with
// GET_RESPONSE, long payloads sent as chained APDUs.

import {
  CHANNEL_ID,
  CLA_V2,
  INS_GET_RESPONSE,
  INS_GET_STATUS,
  INS_SIGN_OFFCHAIN,
  P1_LAST,
  P1_MORE,
  PQ1_PID,
  PQ1_VID,
  REPORT_SIZE,
  SW_CONDITIONS_NOT_SATISFIED,
  SW_OK,
  TAG_APDU
} from '../config'
import { DeviceError, HidTransport } from './hid'

type Listener = (event: { data: DataView; device?: unknown }) => void

/** Splits `bytes` into the device's reply reports. */
function replyReports(bytes: Uint8Array): Uint8Array[] {
  const reports: Uint8Array[] = []
  let offset = 0
  let seq = 0
  do {
    const report = new Uint8Array(REPORT_SIZE)
    report.set([CHANNEL_ID >> 8, CHANNEL_ID & 0xff, TAG_APDU, seq >> 8, seq & 0xff])
    const headerLen = seq === 0 ? 7 : 5
    if (seq === 0) report.set([bytes.length >> 8, bytes.length & 0xff], 5)
    const chunk = bytes.subarray(offset, offset + REPORT_SIZE - headerLen)
    report.set(chunk, headerLen)
    reports.push(report)
    offset += chunk.length
    seq += 1
  } while (offset < bytes.length)
  return reports
}

const reply = (data: number[] | Uint8Array, sw: number) =>
  new Uint8Array([...data, sw >> 8, sw & 0xff])

/** A PQ1 on the other end of WebHID. Reassembles each APDU the host sends
 *  and answers it with whatever `answer` returns, one report per tick. */
class FakePq1 {
  vendorId = PQ1_VID

  productId = PQ1_PID

  opened = false

  apdus: Uint8Array[] = []

  reports: Uint8Array[] = []

  #listeners = new Set<Listener>()

  #pending: Uint8Array | null = null

  #expected = 0

  #outbox: Uint8Array[] = []

  #draining = false

  constructor(private readonly answer: (apdu: Uint8Array) => Uint8Array) {}

  async open() {
    this.opened = true
  }

  async close() {
    this.opened = false
  }

  addEventListener(type: string, listener: Listener) {
    if (type === 'inputreport') this.#listeners.add(listener)
  }

  removeEventListener(type: string, listener: Listener) {
    if (type === 'inputreport') this.#listeners.delete(listener)
  }

  async sendReport(_reportId: number, report: Uint8Array) {
    this.reports.push(new Uint8Array(report))
    const seq = (report[3]! << 8) | report[4]!
    if (seq === 0) {
      this.#expected = (report[5]! << 8) | report[6]!
      this.#pending = report.slice(7, 7 + Math.min(this.#expected, REPORT_SIZE - 7))
    } else {
      const rest = this.#expected - this.#pending!.length
      const chunk = report.slice(5, 5 + Math.min(rest, REPORT_SIZE - 5))
      this.#pending = new Uint8Array([...this.#pending!, ...chunk])
    }
    if (this.#pending!.length < this.#expected) return
    const apdu = this.#pending!
    this.#pending = null
    this.apdus.push(apdu)
    this.#emit(replyReports(this.answer(apdu)))
  }

  /** Replies leave in order, one report per tick, like a device that
   *  handles one request at a time. */
  #emit(reports: Uint8Array[]) {
    this.#outbox.push(...reports)
    if (!this.#draining) this.#drain()
  }

  #drain() {
    const next = this.#outbox.shift()
    this.#draining = next !== undefined
    if (!next) return
    setTimeout(() => {
      this.#listeners.forEach((listener) => listener({ data: new DataView(next.buffer) }))
      this.#drain()
    }, 0)
  }
}

let hidListeners: Record<string, Listener[]> = {}

function installWebHid(device: FakePq1 | null) {
  hidListeners = {}
  Object.defineProperty(globalThis.navigator, 'hid', {
    configurable: true,
    value: device && {
      getDevices: async () => [device],
      requestDevice: async () => [],
      addEventListener: (type: string, listener: Listener) => {
        hidListeners[type] = [...(hidListeners[type] ?? []), listener]
      },
      removeEventListener: (type: string, listener: Listener) => {
        hidListeners[type] = (hidListeners[type] ?? []).filter((l) => l !== listener)
      }
    }
  })
}

async function connectedTo(device: FakePq1) {
  installWebHid(device)
  const transport = new HidTransport()
  await transport.connect()
  return transport
}

const bytesFrom = (length: number, seed: number) =>
  Uint8Array.from({ length }, (_, i) => (i * 7 + seed) & 0xff)

afterEach(() => {
  delete (globalThis.navigator as { hid?: unknown }).hid
})

describe('HidTransport', () => {
  it('sends a short APDU in one report and reads a one-report reply', async () => {
    const device = new FakePq1(() => reply([0, 10], SW_OK))
    const transport = await connectedTo(device)

    await expect(transport.sendApdu(INS_GET_STATUS)).resolves.toEqual({
      sw: SW_OK,
      data: new Uint8Array([0, 10])
    })
    expect(device.reports).toHaveLength(1)
    expect(Array.from(device.reports[0]!.subarray(0, 12))).toEqual([
      CHANNEL_ID >> 8,
      CHANNEL_ID & 0xff,
      TAG_APDU,
      0,
      0,
      0,
      5, // APDU length
      CLA_V2,
      INS_GET_STATUS,
      0,
      0,
      0 // Lc
    ])
  })

  it('reassembles a reply that spans several reports', async () => {
    const data = bytesFrom(300, 1)
    const transport = await connectedTo(new FakePq1(() => reply(data, SW_OK)))

    await expect(transport.sendApdu(INS_GET_STATUS)).resolves.toEqual({ sw: SW_OK, data })
  })

  it('collects a 0x61xx reply with GET_RESPONSE', async () => {
    const first = bytesFrom(40, 2)
    const second = bytesFrom(70, 3)
    const device = new FakePq1((apdu) =>
      apdu[1] === INS_GET_RESPONSE ? reply(second, SW_OK) : reply(first, 0x6146)
    )
    const transport = await connectedTo(device)

    await expect(transport.sendApdu(INS_GET_STATUS)).resolves.toEqual({
      sw: SW_OK,
      data: new Uint8Array([...first, ...second])
    })
    expect(device.apdus.map((apdu) => apdu[1])).toEqual([INS_GET_STATUS, INS_GET_RESPONSE])
  })

  it('sends a long payload as chained APDUs and returns the last reply', async () => {
    const payload = bytesFrom(600, 4)
    const device = new FakePq1((apdu) =>
      apdu[2] === P1_LAST ? reply([1, 2, 3], SW_OK) : reply([], SW_OK)
    )
    const transport = await connectedTo(device)

    await expect(transport.sendChainedApdu(INS_SIGN_OFFCHAIN, payload)).resolves.toEqual({
      sw: SW_OK,
      data: new Uint8Array([1, 2, 3])
    })
    expect(device.apdus.map((apdu) => [apdu[2], apdu[4]])).toEqual([
      [P1_MORE, 255],
      [P1_MORE, 255],
      [P1_LAST, 90]
    ])
    expect(new Uint8Array(device.apdus.flatMap((apdu) => [...apdu.subarray(5)]))).toEqual(payload)
  })

  it('stops a chained send at the first refused chunk', async () => {
    const device = new FakePq1(() => reply([], SW_CONDITIONS_NOT_SATISFIED))
    const transport = await connectedTo(device)

    await expect(transport.sendChainedApdu(INS_SIGN_OFFCHAIN, bytesFrom(600, 5))).resolves.toEqual({
      sw: SW_CONDITIONS_NOT_SATISFIED,
      data: new Uint8Array(0)
    })
    expect(device.apdus).toHaveLength(1)
  })

  it('runs one exchange at a time, so overlapping requests never read each other’s replies', async () => {
    const replies = [bytesFrom(150, 6), bytesFrom(150, 7)]
    let answered = 0
    const device = new FakePq1(() => reply(replies[answered++]!, SW_OK))
    const transport = await connectedTo(device)

    const [first, second] = await Promise.all([
      transport.sendApdu(INS_GET_STATUS),
      transport.sendApdu(INS_GET_STATUS)
    ])
    expect(first.data).toEqual(replies[0])
    expect(second.data).toEqual(replies[1])
  })

  it('fails a pending read at once when the device is unplugged', async () => {
    const device = new FakePq1(() => new Uint8Array(0))
    device.sendReport = async (_reportId: number, report: Uint8Array) => {
      device.reports.push(report) // never answers
    }
    const transport = await connectedTo(device)
    const onDisconnect = jest.fn()
    transport.onDisconnect = onDisconnect

    const pending = transport.sendApdu(INS_GET_STATUS)
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
    hidListeners.disconnect!.forEach((listener) =>
      listener({ device, data: new DataView(new ArrayBuffer(0)) })
    )

    await expect(pending).rejects.toMatchObject({ code: 'disconnected' })
    expect(onDisconnect).toHaveBeenCalledTimes(1)
    expect(transport.isConnected()).toBe(false)
  })

  it('reports a browser without WebHID as unsupported', async () => {
    installWebHid(null)
    delete (globalThis.navigator as { hid?: unknown }).hid

    const error = await new HidTransport().connect().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(DeviceError)
    expect(error).toMatchObject({ code: 'unsupported' })
  })
})
