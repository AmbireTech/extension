import { TypedDataEncoder } from 'ethers'
import { PermissionsAndroid, Platform } from 'react-native'

import AppEth, { ledgerService } from '@ledgerhq/hw-app-eth'
import TransportBLE from '@ledgerhq/react-native-hw-transport-ble'

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

// The user declined the operation on the device (Ledger status words 0x6985
// "denied by user" / 0x5501 "rejected"). Detected so we never silently retry a
// rejected signature.
const isUserRejection = (e: any): boolean => {
  if (e?.statusCode === 0x6985 || e?.statusCode === 0x5501) return true
  const message = (e?.message || '').toLowerCase()
  return (
    message.includes('6985') || message.includes('5501') || message.includes('denied by the user')
  )
}

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
  #transport: TransportBLE | null = null

  #eth: AppEth | null = null

  #connectedDeviceId = ''

  // The last device we connected to, kept across cleanUp() so device operations
  // can transparently reopen the transport (the worker tears the session down
  // between import attempts, and signing happens after the screen is gone).
  #lastDeviceId = ''

  // BLE cannot handle parallel APDU exchanges (the device throws "busy"), so
  // every device operation is serialized through this single-concurrency chain.
  #queue: Promise<unknown> = Promise.resolve()

  // Connection-state subscribers (e.g. the useLedger hook), so the UI can react
  // to connect/disconnect without polling.
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

  /**
   * Opens a transport to the selected device and builds the Ethereum app client.
   * A fresh transport/app is created on every connect; any previous one is torn
   * down first.
   */
  connect = async (deviceId: string): Promise<void> => {
    if (this.#connectedDeviceId === deviceId && this.isConnected()) return

    await this.cleanUp()

    this.#transport = await TransportBLE.open(deviceId)
    this.#connectedDeviceId = deviceId
    this.#lastDeviceId = deviceId
    this.#eth = new AppEth(this.#transport)

    // Reset everything if the device drops the link, so the next operation
    // surfaces a clean "not connected" instead of hanging on a dead transport.
    this.#transport.on('disconnect', () => {
      this.#transport = null
      this.#eth = null
      this.#connectedDeviceId = ''
      this.#emitConnection()
    })

    this.#emitConnection()
  }

  // Returns a live Ethereum app client, transparently reopening the transport to
  // the last device if the session was torn down (e.g. by the worker between
  // import attempts, or after the connect screen unmounted).
  async #ensureConnected(): Promise<AppEth> {
    if (this.#eth) return this.#eth

    if (!this.#lastDeviceId)
      throw new Error('Ledger is not connected. Please connect your device and try again.')

    await this.connect(this.#lastDeviceId)
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
        // signEIP712Message is unsupported on some apps/devices (e.g. Nano S) →
        // fall back to blind hashed signing. But a USER REJECTION must NOT fall
        // back: that would silently re-prompt the device and could produce a
        // signature the user refused (leaving the account op looking "signed").
        // Re-throw it so the sign fails cleanly.
        if (isUserRejection(e)) throw e

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

  cleanUp = async (): Promise<void> => {
    if (this.#transport) {
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
    this.#emitConnection()
  }
}

export default new LedgerBleService()
