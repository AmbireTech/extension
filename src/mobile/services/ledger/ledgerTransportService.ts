import { PermissionsAndroid, Platform } from 'react-native'
import { BleManager, State as BleState } from 'react-native-ble-plx'
import { Observable } from 'rxjs'
import { Hex } from 'viem'

import { BIP44_LEDGER_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { getHdPathFromTemplate, getHdPathWithoutRoot } from '@ambire-common/utils/hdPath'
import hexStringToUint8Array from '@ambire-common/utils/hexStringToUint8Array'
import wait from '@ambire-common/utils/wait'
import { isProd } from '@common/config/env'
import { ContextModuleBuilder } from '@ledgerhq/context-module'
import {
  DeviceActionStatus,
  DeviceManagementKitBuilder,
  DeviceStatus,
  DiscoveredDevice,
  UserInteractionRequired
} from '@ledgerhq/device-management-kit'
import { SignerEthBuilder, TypedDataDomain } from '@ledgerhq/device-signer-kit-ethereum'
import { RNBleTransportFactory } from '@ledgerhq/device-transport-kit-react-native-ble'
import { RNHidTransportFactory } from '@ledgerhq/device-transport-kit-react-native-hid'

// All Ledger device communication on mobile happens HERE, in the React Native
// native JS context, using Ledger's Device Management Kit (DMK) — the same
// stack the extension uses (see src/web/.../LedgerController.ts), but with the
// React Native BLE/USB transports. The WebView worker (where the controllers
// live) has no access to Bluetooth/USB or native modules, so the worker-side
// LedgerController forwards every operation to this singleton over the message
// bridge (see WebViewWorker.tsx `ledger.*` cases).
//
// This service throws RAW device messages / status codes (never normalized):
// both call sites — the worker LedgerController (bridge) and the connect UI —
// run the result through `normalizeLedgerMessage`, so normalizing here would
// double-map and mangle the text.

export interface LedgerTransportSignature {
  r: Hex
  s: Hex
  v: number
}

export interface LedgerScannedDevice {
  id: string
  name: string
}

export interface LedgerSubscription {
  unsubscribe: () => void
}

export type LedgerTransportType = 'ble' | 'usb'

// EIP-712 typed data, as it travels across the bridge from the worker.
interface LedgerTypedData {
  domain: Record<string, any>
  types: Record<string, { name: string; type: string }[]>
  message: Record<string, any>
  primaryType: string
}

type Dmk = ReturnType<DeviceManagementKitBuilder['build']>
type SignerEth = ReturnType<SignerEthBuilder['build']>

// DiscoveredDevice.transport identifiers exposed by the RN transports.
const TRANSPORT_ID: Record<LedgerTransportType, string> = { ble: 'RN_BLE', usb: 'RN_HID' }

// The device is reachable but needs the user to act (unlock / open the Ethereum
// app) — retrying the connect probe won't clear it, so surface it right away.
const isDeviceActionNeededError = (e: any): boolean => {
  const message = (e?.message || '').toLowerCase()
  return message.includes('unlock-device') || message.includes('confirm-open-app')
}

const buildDmk = (): Dmk =>
  new DeviceManagementKitBuilder()
    .addTransport(RNBleTransportFactory)
    .addTransport(RNHidTransportFactory)
    // To debug discovery/permission/scan, add DMK's ConsoleLogger here:
    // .addLogger(new ConsoleLogger())
    .build()

/**
 * The DMK ContextModule requires a logger factory to work with a physical
 * device (mirrors the extension). No-op in prod so nothing leaks to logs.
 */
const createContextLogger = (tag: string) => {
  if (isProd) {
    return { subscribers: [], error: () => {}, warn: () => {}, info: () => {}, debug: () => {} }
  }

  return {
    subscribers: [],
    error: (message: string) => console.error(`[ContextModule:${tag}]`, message),
    warn: (message: string) => console.warn(`[ContextModule:${tag}]`, message),
    info: (message: string) => console.info(`[ContextModule:${tag}]`, message),
    debug: (message: string) => console.debug(`[ContextModule:${tag}]`, message)
  }
}

class LedgerTransportService {
  /** The DMK instance, built once and kept alive for discovery + sessions. */
  #dmk: Dmk | null = null

  /** The Ethereum signer bound to the current device session (clear signing). */
  #signerEth: SignerEth | null = null

  /** Current device session id; null when no device is connected. */
  #sessionId: string | null = null

  /**
   * The last device we opened a session to, kept so signing can transparently
   * reopen a session (the worker tears the session down between import attempts,
   * and signing happens after the connect screen is gone).
   */
  #lastDevice: DiscoveredDevice | null = null

  /** Raw discovered devices by id, so connect can pass DMK the device object. */
  #discovered = new Map<string, DiscoveredDevice>()

  /** Active discovery (scan) subscription; stopped before connecting. */
  #discoverySub: LedgerSubscription | null = null

  /** Live subscription to the device session state (idle disconnect detection). */
  #sessionStateSub: LedgerSubscription | null = null

  /** Cancels the in-flight signing subscription (used by signingCleanup). */
  #rejectSigningSubscription: (() => void) | null = null

  /** Lazily-created BLE manager, used only to observe the adapter state. */
  #bleManager: BleManager | null = null

  /**
   * Connection-state subscribers (e.g. the useLedger hook), so the UI can react
   * without polling. "Connected" means a live session with a usable signer.
   */
  #connectionListeners = new Set<(connected: boolean) => void>()

  subscribeConnection = (listener: (connected: boolean) => void): LedgerSubscription => {
    this.#connectionListeners.add(listener)
    return { unsubscribe: () => this.#connectionListeners.delete(listener) }
  }

  #emitConnection() {
    const connected = this.isConnected()
    this.#connectionListeners.forEach((listener) => listener(connected))
  }

  isConnected = () => !!this.#signerEth && !!this.#sessionId

  /**
   * Reports the Bluetooth adapter state (`available` is true only when powered
   * on). Uses ble-plx directly since DMK does not surface adapter state.
   */
  observeBluetoothState = (
    onState: (state: { available: boolean; type: string }) => void
  ): LedgerSubscription => {
    if (!this.#bleManager) this.#bleManager = new BleManager()
    const sub = this.#bleManager.onStateChange(
      (state) => onState({ available: state === BleState.PoweredOn, type: state }),
      true
    )
    return { unsubscribe: () => sub.remove() }
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

  /**
   * Streams discovered devices of one transport (BLE or USB) via DMK. Devices
   * are reported one-by-one via `onAdd`. Scanning is costly, so the caller MUST
   * unsubscribe once a device is selected.
   */
  startDiscovering = (
    transport: LedgerTransportType,
    onAdd: (device: LedgerScannedDevice) => void,
    onError: (error: any) => void
  ): LedgerSubscription => {
    if (!this.#dmk) this.#dmk = buildDmk()

    // One scan at a time; drop any previous before starting a new one.
    this.#stopDiscovering()

    // The RN transports scan via listenToAvailableDevices (their startDiscovering
    // is a no-op stub). It re-emits the full device list; filter to the requested
    // transport and let the caller dedupe by id.
    const sub = this.#dmk.listenToAvailableDevices({}).subscribe({
      next: (devices) => {
        devices.forEach((device) => {
          this.#discovered.set(device.id, device)
          if (device.transport !== TRANSPORT_ID[transport]) return
          onAdd({ id: device.id, name: device.name || 'Ledger' })
        })
      },
      error: onError,
      complete: () => {}
    })

    const wrapped: LedgerSubscription = {
      unsubscribe: () => {
        sub.unsubscribe()
        if (this.#discoverySub === wrapped) this.#discoverySub = null
      }
    }
    this.#discoverySub = wrapped
    return wrapped
  }

  #stopDiscovering = () => {
    this.#discoverySub?.unsubscribe()
    this.#discoverySub = null
  }

  /**
   * Connects to a discovered device, then probes one address to verify the
   * device is usable (unlocked + Ethereum app open). Only after the probe
   * succeeds is the connection announced, so the connect modal stays open until
   * the device is actually ready.
   */
  connectAndProbe = async (device: {
    id: string
    transport: LedgerTransportType
  }): Promise<void> => {
    const discovered = this.#discovered.get(device.id)
    if (!discovered)
      throw new Error('Ledger device is no longer available. Please rescan and try again.')

    // Stop scanning before connecting: Android BLE can't reliably connect while a
    // scan is running, and the discovery subscription would otherwise re-arm it.
    this.#stopDiscovering()
    await this.cleanUp()

    const probePath = getHdPathFromTemplate(BIP44_LEDGER_DERIVATION_TEMPLATE, 0)
    // BLE's first connect right after a scan is flaky; retry once with a short
    // settle. Bail early when the device just needs user action (won't self-clear).
    const backoffMs = [0, 500]
    let lastError: any
    for (const ms of backoffMs) {
      if (ms) await wait(ms)
      try {
        await this.#openSession(discovered)
        await this.getAddress(probePath)
        this.#emitConnection()
        return
      } catch (e: any) {
        lastError = e
        await this.cleanUp()
        if (isDeviceActionNeededError(e)) break
      }
    }

    throw lastError
  }

  #openSession = async (device: DiscoveredDevice): Promise<void> => {
    if (!this.#dmk) this.#dmk = buildDmk()

    const sessionId = await this.#dmk.connect({
      device,
      sessionRefresherOptions: { isRefresherDisabled: true }
    })
    this.#sessionId = sessionId
    this.#lastDevice = device

    const contextModule = new ContextModuleBuilder({
      originToken: 'ambire',
      loggerFactory: createContextLogger
    }).build()
    this.#signerEth = new SignerEthBuilder({ dmk: this.#dmk, sessionId })
      .withContextModule(contextModule)
      .build()

    this.#subscribeSessionState(sessionId)
  }

  /**
   * Returns a live Ethereum signer, transparently reopening a session to the
   * last device if it was torn down (e.g. by the worker between import attempts,
   * or after the connect screen unmounted).
   */
  #ensureSession = async (): Promise<SignerEth> => {
    if (this.#signerEth && this.#sessionId) return this.#signerEth

    const device = this.#lastDevice
    if (!device)
      throw new Error('Ledger is not connected. Please connect your device and try again.')

    await this.#openSession(device)
    if (!this.#signerEth) throw new Error('Could not reconnect to the Ledger device.')

    return this.#signerEth
  }

  #subscribeSessionState = (sessionId: string) => {
    this.#sessionStateSub?.unsubscribe()
    if (!this.#dmk) return

    const sub = this.#dmk.getDeviceSessionState({ sessionId }).subscribe({
      next: (state) => {
        if (state.deviceStatus === DeviceStatus.NOT_CONNECTED) this.#handleDisconnect()
      },
      error: () => {}
    })
    this.#sessionStateSub = { unsubscribe: () => sub.unsubscribe() }
  }

  #handleDisconnect = () => {
    this.#sessionStateSub?.unsubscribe()
    this.#sessionStateSub = null
    this.#signerEth = null
    this.#sessionId = null
    this.#emitConnection()
  }

  getAddress = async (path: string): Promise<string> => {
    const signerEth = await this.#ensureSession()
    return this.#handleLedgerSubscription<string>(
      signerEth.getAddress(getHdPathWithoutRoot(path), {
        checkOnDevice: false,
        returnChainCode: false
      }).observable,
      {
        onCompleted: (output) => output.address,
        errorMessage: 'Failed to get address from Ledger device'
      }
    )
  }

  signPersonalMessage = async (
    path: string,
    messageHex: string
  ): Promise<LedgerTransportSignature> => {
    const signerEth = await this.#ensureSession()
    return this.#handleLedgerSubscription<LedgerTransportSignature>(
      signerEth.signMessage(getHdPathWithoutRoot(path), hexStringToUint8Array(messageHex))
        .observable,
      {
        onCompleted: (output) => output,
        errorMessage: 'Failed to sign message with Ledger device',
        isSign: true
      }
    )
  }

  signTransaction = async (path: string, rawTxHex: string): Promise<LedgerTransportSignature> => {
    const signerEth = await this.#ensureSession()
    // Clear signing is applied automatically by the ContextModule (built in
    // #openSession) — the device shows human-readable details when metadata
    // exists, otherwise it falls back to blind signing.
    return this.#handleLedgerSubscription<LedgerTransportSignature>(
      signerEth.signTransaction(getHdPathWithoutRoot(path), hexStringToUint8Array(rawTxHex))
        .observable,
      {
        onCompleted: (output) => output,
        errorMessage: 'Failed to sign transaction with Ledger device',
        isSign: true
      }
    )
  }

  signTypedData = async (
    path: string,
    typedData: LedgerTypedData
  ): Promise<LedgerTransportSignature> => {
    const signerEth = await this.#ensureSession()
    // DMK handles device-capability fallback (e.g. Nano S hashed signing)
    // internally, so no manual EIP-712 fallback is needed here.
    return this.#handleLedgerSubscription<LedgerTransportSignature>(
      signerEth.signTypedData(getHdPathWithoutRoot(path), {
        domain: { ...typedData.domain } as TypedDataDomain,
        types: typedData.types,
        message: typedData.message,
        primaryType: typedData.primaryType
      }).observable,
      {
        onCompleted: (output) => output,
        errorMessage: 'Failed to sign typed data with Ledger device',
        isSign: true
      }
    )
  }

  /**
   * Cancels the in-flight signing subscription after an abandoned/rejected sign
   * so the next command starts clean (mirrors the extension). Not a device flush.
   */
  signingCleanup = async (): Promise<void> => {
    if (!this.#rejectSigningSubscription) return
    this.#rejectSigningSubscription()
    this.#rejectSigningSubscription = null
  }

  cleanUp = async (): Promise<void> => {
    this.#sessionStateSub?.unsubscribe()
    this.#sessionStateSub = null

    if (this.#dmk && this.#sessionId) {
      try {
        await this.#dmk.disconnect({ sessionId: this.#sessionId })
      } catch {
        // The device may already be gone (unplugged/out of range); disconnecting
        // a dead session is not actionable, just reset our state.
      }
    }

    this.#signerEth = null
    this.#sessionId = null
    this.#emitConnection()
  }

  /**
   * Bridges a DMK device-action observable to a promise: rejects (raw) on a
   * required user interaction (unlock / open app) or device error, resolves on
   * completion. Mirrors the extension's #handleLedgerSubscription.
   */
  #handleLedgerSubscription<T>(
    observable: Observable<any>,
    options: { onCompleted: (output: any) => T; errorMessage: string; isSign?: boolean }
  ): Promise<T> {
    const { onCompleted, errorMessage, isSign } = options

    const subscriptionPromise = new Promise<T>((resolve, reject) => {
      let subscription: { unsubscribe: () => void } | undefined
      let isCancelled = false

      subscription = observable.subscribe({
        next: (response: any) => {
          if (isCancelled) return

          // Surface the device-not-ready states so the caller can prompt the
          // user (both callers normalize these raw strings).
          const missingRequiredUserInteraction =
            response.status === DeviceActionStatus.Pending &&
            [UserInteractionRequired.UnlockDevice, UserInteractionRequired.ConfirmOpenApp].includes(
              response.intermediateValue.requiredUserInteraction
            )

          if (missingRequiredUserInteraction) {
            subscription?.unsubscribe()
            reject(new Error(response.intermediateValue.requiredUserInteraction))
            return
          }

          if (response.status === DeviceActionStatus.Error) {
            subscription?.unsubscribe()
            const deviceMessage =
              response.error?.message || response.error?._tag || 'no response from device'
            const deviceErrorCode = response.error?.errorCode
            let message = `<${deviceMessage}>`
            message = deviceErrorCode ? `${message}, error code: <${deviceErrorCode}>` : message
            reject(new Error(message))
            return
          }

          if (response.status !== DeviceActionStatus.Completed) return

          subscription?.unsubscribe()
          this.#rejectSigningSubscription = null
          if (response?.output) resolve(onCompleted(response.output))
          else reject(new Error(errorMessage))
        },
        error: (error: any) => {
          subscription?.unsubscribe()
          reject(new Error(error?.message || 'no response from device'))
        }
      })

      if (isSign) {
        this.#rejectSigningSubscription = () => {
          isCancelled = true
          subscription?.unsubscribe()
          reject(new Error('Operation cancelled by user'))
        }
      }
    })

    return this.#withDisconnectProtection(() => subscriptionPromise)
  }

  /**
   * Races an operation against the device session going NOT_CONNECTED, so a
   * mid-operation disconnect rejects promptly instead of hanging the SDK.
   */
  async #withDisconnectProtection<T>(operation: () => Promise<T>): Promise<T> {
    const sessionId = this.#sessionId
    if (!sessionId || !this.#dmk) return operation()

    let sub: { unsubscribe: () => void } | undefined
    try {
      return await Promise.race<T>([
        operation(),
        new Promise<never>((_, reject) => {
          sub = this.#dmk!.getDeviceSessionState({ sessionId }).subscribe({
            next: (state) => {
              if (state.deviceStatus === DeviceStatus.NOT_CONNECTED)
                reject(new Error('DeviceDisconnectedWhileSendingError'))
            },
            error: () => {}
          })
        })
      ])
    } finally {
      sub?.unsubscribe()
    }
  }
}

export default new LedgerTransportService()
