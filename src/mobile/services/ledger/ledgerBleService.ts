import { TypedDataEncoder } from 'ethers'
import { PermissionsAndroid, Platform } from 'react-native'

import { BIP44_LEDGER_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import AppEth, { ledgerService } from '@ledgerhq/hw-app-eth'
import type Transport from '@ledgerhq/hw-transport'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'

import ledgerUsbTransport from './ledgerUsbTransport'

// All Ledger device communication on mobile happens HERE, in the React Native
// native JS context. The WebView worker (where the controllers live) has no
// access to Bluetooth/USB or native modules, so the worker-side LedgerController
// forwards every operation to this singleton over the message bridge
// (see WebViewWorker.tsx `ledger.*` cases). This mirrors how `crypto.scrypt` and
// `network.fetch` are bridged.

export interface LedgerBleSignature {
  r: string // 0x-prefixed
  s: string // 0x-prefixed
  v: number
}

export interface LedgerScannedDevice {
  id: string
  name: string
}

export interface LedgerSubscription {
  unsubscribe: () => void
}

// EIP-712 typed data, as it travels across the bridge from the worker.
interface LedgerTypedData {
  domain: Record<string, any>
  types: Record<string, { name: string; type: string }[]>
  message: Record<string, any>
  primaryType: string
}

// Paths arrive from ambire-common as e.g. "m/44'/60'/0'/0/0", but hw-app-eth
// expects them without the "m/" root (matches the web controller's
// getHdPathWithoutRoot).
const stripHdPathRoot = (path: string) => (path.startsWith('m/') ? path.slice(2) : path)

const TIMEOUT_FOR_RETRIEVING_FROM_LEDGER = 5000

// Upper bound on the clear-signing descriptor lookup before falling back to blind
// signing, so a slow/offline Ledger service can't block a transaction signature.
const CLEAR_SIGN_RESOLUTION_TIMEOUT = 5000

// App doesn't support full EIP-712 clear-signing (INS_NOT_SUPPORTED / 0x6d00,
// e.g. Nano S) — the only case we may fall back to blind hashed signing.
const isEip712UnsupportedError = (e: any): boolean => {
  if (e?.statusCode === 0x6d00) return true
  const statusText = (e?.statusText || '').toUpperCase()
  if (statusText === 'INS_NOT_SUPPORTED') return true
  const message = (e?.message || '').toUpperCase()
  return message.includes('6D00') || message.includes('INS_NOT_SUPPORTED')
}

// Errors that won't clear by waiting: the device is locked, on the wrong app, or
// needs a firmware/app update. Retrying the connect probe through the full
// backoff just delays surfacing the real error, so we bail on the first one.
const UNRECOVERABLE_STATUS_CODES = [0x5515, 0x6b0c, 0x650f, 0x6511, 0x6e00, 0x6b00, 0x6d00, 0x6a80]
const isUnrecoverableProbeError = (e: any): boolean => {
  if (UNRECOVERABLE_STATUS_CODES.includes(e?.statusCode)) return true
  const message = (e?.message || '').toLowerCase()
  if (message.includes('unlock-device') || message.includes('confirm-open-app')) return true
  return UNRECOVERABLE_STATUS_CODES.some((code) => message.includes(code.toString(16)))
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })

const withTimeoutProtection = <T>(operation: () => Promise<T>): Promise<T> => {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(
          'Cannot connect to your Ledger device for an extended period. Please make sure it is unlocked, the Ethereum app is open, and it is within Bluetooth range, then try again.'
        )
      )
    }, TIMEOUT_FOR_RETRIEVING_FROM_LEDGER)
  })

  return Promise.race([operation(), timeout])
}

class LedgerBleService {
  // Holds either a BLE or a USB (Android HID) transport — both implement
  // @ledgerhq/hw-transport's Transport, so AppEth and all signing code below are
  // transport-agnostic.
  #transport: Transport | null = null

  #eth: AppEth | null = null

  #connectedDeviceId = ''

  // The last device we connected to, kept across cleanUp() so device operations
  // can transparently reopen the transport (the worker tears the session down
  // between import attempts, and signing happens after the screen is gone).
  #lastDeviceId = ''

  // Which transport the last/active connection used, so reconnect reopens the
  // right one.
  #lastTransportType: 'ble' | 'usb' = 'ble'

  // Active subscription to USB detach events (cable pulled), so we drop the
  // connection state even while idle. BLE handles this via the transport's own
  // 'disconnect' event.
  #usbDetachSub: LedgerSubscription | null = null

  // BLE cannot handle parallel APDU exchanges (the device throws "busy"), so
  // every device operation is serialized through this single-concurrency chain.
  #queue: Promise<unknown> = Promise.resolve()

  // Connection-state subscribers (e.g. the useLedger hook), so the UI can react
  // without polling. "Connected" means verified usable (post-probe), not merely
  // a transport being open — see connectAndProbe / #setActiveTransport.
  #connectionListeners = new Set<(connected: boolean) => void>()

  subscribeConnection = (listener: (connected: boolean) => void): LedgerSubscription => {
    this.#connectionListeners.add(listener)
    return { unsubscribe: () => this.#connectionListeners.delete(listener) }
  }

  #emitConnection() {
    const connected = this.isConnected()
    this.#connectionListeners.forEach((listener) => listener(connected))
  }

  #enqueue<T>(task: () => Promise<T>): Promise<T> {
    const run = this.#queue.then(task, task)
    // Swallow the result/rejection on the chain itself so one failed op doesn't
    // break the chain for the next; callers still get the real promise.
    this.#queue = run.then(
      () => {},
      () => {}
    )
    return run
  }

  isConnected = () => !!this.#transport && !!this.#eth

  /**
   * Subscribes to the Bluetooth adapter state. `onState.available` is true only
   * when Bluetooth is powered on and usable.
   */
  observeBluetoothState = (
    onState: (state: { available: boolean; type: string }) => void,
    onError: (error: any) => void = () => {}
  ): LedgerSubscription => {
    const sub = TransportBLE.observeState({
      next: onState,
      error: onError,
      complete: () => {}
    })
    return { unsubscribe: () => sub.unsubscribe() }
  }

  /**
   * Android requires runtime BLE permissions (API 31+: SCAN + CONNECT). iOS
   * triggers its system prompt automatically on first BLE use via the
   * NSBluetoothAlwaysUsageDescription Info.plist key, so there's nothing to
   * request here.
   */
  requestAndroidPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true

    const permissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
    ].filter(Boolean) as string[]

    // Pre-Android 12 has no SCAN/CONNECT permissions; BLE scanning there needs
    // fine location instead.
    if (Platform.Version < 31) {
      permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    }

    const result = await PermissionsAndroid.requestMultiple(permissions as any)
    return permissions.every(
      (permission) => result[permission as keyof typeof result] === 'granted'
    )
  }

  /**
   * Starts a BLE scan. Devices are reported one-by-one via `onAdd` as they are
   * discovered. Scanning is costly, so the caller MUST unsubscribe once a device
   * is selected.
   */
  startScan = (
    onAdd: (device: LedgerScannedDevice) => void,
    onError: (error: any) => void
  ): LedgerSubscription => {
    const sub = TransportBLE.listen({
      next: (event: any) => {
        if (event.type !== 'add' || !event.descriptor) return
        onAdd({ id: event.descriptor.id, name: event.descriptor.name || 'Ledger' })
      },
      error: onError,
      complete: () => {}
    })

    return { unsubscribe: () => sub.unsubscribe() }
  }

  isUsbSupported = (): Promise<boolean> => ledgerUsbTransport.isSupported()

  // Currently connected USB Ledger devices (Android; empty on iOS / when none).
  listUsbDevices = () => ledgerUsbTransport.list()

  /**
   * Whether BLE scanning is already permitted, WITHOUT prompting (so the connect
   * UI can auto-scan only when allowed and otherwise show an explicit
   * "Scan via Bluetooth" action).
   */
  hasBlePermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true

    if (Platform.Version < 31) {
      return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
    }

    const [scan, connect] = await Promise.all([
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN),
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)
    ])
    return scan && connect
  }

  // Wires an opened transport (BLE or USB) into the service: builds the Ethereum
  // app client and resets everything if the device drops the link, so the next
  // operation surfaces a clean "not connected" instead of hanging on a dead
  // transport.
  #setActiveTransport(transport: Transport, deviceId: string, type: 'ble' | 'usb') {
    this.#transport = transport
    this.#connectedDeviceId = deviceId
    this.#lastDeviceId = deviceId
    this.#lastTransportType = type
    this.#eth = new AppEth(transport)

    // BLE drops fire the transport's own 'disconnect'. USB only emits that on a
    // failed exchange, so also listen for the cable being pulled while idle —
    // otherwise the UI keeps thinking it's connected and signing fails with an
    // I/O error instead of showing the reconnect modal.
    transport.on('disconnect', this.#handleDisconnect)
    if (type === 'usb') {
      this.#usbDetachSub = ledgerUsbTransport.onDisconnect(this.#handleDisconnect)
    }

    // Intentionally NOT emitting "connected" here: an open transport doesn't mean
    // the device is usable (it may be locked or not on the Ethereum app).
    // connectAndProbe emits only after a successful probe, so the connect modal
    // stays open until the device is actually ready.
  }

  #handleDisconnect = () => {
    this.#transport = null
    this.#eth = null
    this.#connectedDeviceId = ''
    this.#usbDetachSub?.unsubscribe()
    this.#usbDetachSub = null
    this.#emitConnection()
  }

  /**
   * Opens a BLE transport to the selected device and builds the Ethereum app
   * client. A fresh transport/app is created on every connect; any previous one
   * is torn down first.
   */
  connect = async (deviceId: string): Promise<void> => {
    if (this.#connectedDeviceId === deviceId && this.isConnected()) return

    await this.cleanUp()

    const transport = await TransportBLE.open(deviceId)
    this.#setActiveTransport(transport, deviceId, 'ble')
  }

  /**
   * Opens a USB (Android HID) transport to the connected Ledger. Wired, so there
   * is no scanning/pairing — opening triggers Android's USB permission dialog.
   */
  connectUsb = async (): Promise<void> => {
    if (this.#lastTransportType === 'usb' && this.isConnected()) return

    await this.cleanUp()

    const transport = await ledgerUsbTransport.open()
    this.#setActiveTransport(transport, 'usb', 'usb')
  }

  /**
   * Connects via the device's transport, then probes one address to verify the
   * device is usable (unlocked + Ethereum app open). The first exchange right
   * after a fresh connection — especially a just-permitted USB device whose link
   * hasn't settled — can fail with a transient "device busy / cannot connect"
   * error; the transport itself is fine and just needs a moment, so the probe is
   * retried with a short backoff (this is what a manual retry-after-a-moment does
   * today). getAddress(checkOnDevice=false) doesn't prompt, so retrying is safe;
   * a genuinely locked / wrong-app device fails every attempt and surfaces its
   * error.
   */
  connectAndProbe = async (device: { id: string; transport: 'ble' | 'usb' }): Promise<void> => {
    if (device.transport === 'usb') await this.connectUsb()
    else await this.connect(device.id)

    const probePath = getHdPathFromTemplate(BIP44_LEDGER_DERIVATION_TEMPLATE, 0)
    const backoffMs = [0, 600, 1200, 1800]
    let lastError: any

    for (const ms of backoffMs) {
      if (ms) await sleep(ms)
      try {
        await this.getAddress(probePath)
        // Only now is the device verified usable (unlocked + Ethereum app open),
        // so announce the connection. Subscribers (useLedger -> isLedgerConnected)
        // drive the connect modal, which must stay open until this point.
        this.#emitConnection()
        return
      } catch (e) {
        lastError = e
        // Locked / wrong-app / firmware errors won't clear by waiting — surface
        // them right away instead of burning the full backoff.
        if (isUnrecoverableProbeError(e)) break
      }
    }

    throw lastError
  }

  // Returns a live Ethereum app client, transparently reopening the transport to
  // the last device if the session was torn down (e.g. by the worker between
  // import attempts, or after the connect screen unmounted).
  async #ensureConnected(): Promise<AppEth> {
    if (this.#eth) return this.#eth

    if (this.#lastTransportType === 'usb') {
      await this.connectUsb()
    } else {
      if (!this.#lastDeviceId)
        throw new Error('Ledger is not connected. Please connect your device and try again.')
      await this.connect(this.#lastDeviceId)
    }

    if (!this.#eth) throw new Error('Could not reconnect to the Ledger device.')

    return this.#eth
  }

  getAddress = (path: string): Promise<string> =>
    this.#enqueue(async () => {
      const eth = await this.#ensureConnected()
      const { address } = await withTimeoutProtection(() =>
        eth.getAddress(stripHdPathRoot(path), false, false)
      )
      return address
    })

  signPersonalMessage = (path: string, messageHex: string): Promise<LedgerBleSignature> =>
    this.#enqueue(async () => {
      const eth = await this.#ensureConnected()
      const { r, s, v } = await eth.signPersonalMessage(stripHdPathRoot(path), messageHex)
      return { r: `0x${r}`, s: `0x${s}`, v }
    })

  signTransaction = (path: string, rawTxHex: string): Promise<LedgerBleSignature> =>
    this.#enqueue(async () => {
      const eth = await this.#ensureConnected()
      // Clear-signing: resolve token / NFT / known-plugin descriptors from
      // Ledger's services so the device shows human-readable details (amount,
      // symbol, decoded action) instead of raw hex — the hw-app-eth equivalent
      // of the extension's DMK ContextModule. If the lookup errors or is slow
      // (offline / unknown contract), fall back to a null resolution, i.e. blind
      // signing (which then needs "Blind signing" enabled on the device;
      // normalizeLedgerMessage surfaces a clear 0x6a80 hint when it isn't).
      const resolution = await Promise.race([
        ledgerService
          .resolveTransaction(
            rawTxHex,
            {},
            { externalPlugins: true, erc20: true, nft: true, uniswapV3: true }
          )
          .catch(() => null),
        new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), CLEAR_SIGN_RESOLUTION_TIMEOUT)
        })
      ])
      const { r, s, v } = await eth.signTransaction(stripHdPathRoot(path), rawTxHex, resolution)
      return { r: `0x${r}`, s: `0x${s}`, v: parseInt(v, 16) }
    })

  signTypedData = (path: string, typedData: LedgerTypedData): Promise<LedgerBleSignature> =>
    this.#enqueue(async () => {
      const eth = await this.#ensureConnected()

      const hdPath = stripHdPathRoot(path)
      try {
        // Full EIP-712 clear-signing. Not supported on the Nano S, hence the
        // hashed-message fallback below.
        const { r, s, v } = await eth.signEIP712Message(hdPath, typedData as any)
        return { r: `0x${r}`, s: `0x${s}`, v }
      } catch (e: any) {
        // Fall back to blind hashed signing ONLY on INS_NOT_SUPPORTED. Re-throw
        // anything else — never silently blind-sign a payload after another error.
        if (!isEip712UnsupportedError(e)) throw e

        // Strip the EIP712Domain entry; hashStruct only takes the message types.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { EIP712Domain, ...structTypes } = typedData.types
        const domainSeparator = TypedDataEncoder.hashDomain(typedData.domain)
        const hashStruct = TypedDataEncoder.hashStruct(
          typedData.primaryType,
          structTypes,
          typedData.message
        )
        const { r, s, v } = await eth.signEIP712HashedMessage(
          hdPath,
          domainSeparator.slice(2),
          hashStruct.slice(2)
        )
        return { r: `0x${r}`, s: `0x${s}`, v }
      }
    })

  // Flushes the device's pending command state after an abandoned/rejected sign
  // so the next command starts clean (mirrors Ledger Live). Not cancellation.
  signingCleanup = (): Promise<void> =>
    this.#enqueue(async () => {
      if (!this.#transport) return
      try {
        // Zero APDU completes one exchange to realign framing; device replies with
        // a non-0x9000 status (hw-transport throws) — swallow, the flush happened.
        await this.#transport.send(0xe0, 0x00, 0x00, 0x00)
      } catch {
        // Non-9000 status (expected) or idle/disconnected device — nothing to do.
      }
    })

  cleanUp = async (): Promise<void> => {
    if (this.#transport) {
      // Remove the 'disconnect' listener before closing, otherwise a
      // just-replaced transport can still fire it asynchronously afterwards
      // and #handleDisconnect would null out the newer, active transport.
      this.#transport.off('disconnect', this.#handleDisconnect)
      try {
        await this.#transport.close()
      } catch {
        // The transport may already be gone (device unplugged/out of range);
        // closing a dead transport is not actionable, just reset our state.
      }
    }
    this.#transport = null
    this.#eth = null
    this.#connectedDeviceId = ''
    this.#usbDetachSub?.unsubscribe()
    this.#usbDetachSub = null
    this.#emitConnection()
  }
}

export default new LedgerBleService()
