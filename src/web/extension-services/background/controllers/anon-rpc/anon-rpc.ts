import { AnonRpcWorker, type RpcProvider } from '@anon-rpc/browser-extension-harness'
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { ErrorRef, IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import type { storage as extensionStorage } from '@common/services/storage'
import { browser } from '@web/constants/browserapi'

import { createBootstrapProvider } from './bootstrapProvider'
import { AnonRpcPreset, parseAnonRpcPresets } from './presets'

export type AnonRpcStatus = 'off' | 'connecting' | 'connected' | 'failed'

type AnonRpcSettings = {
  isEnabled: boolean
  presetId: string | null
}

// The extension's storage rather than ambire-common's `Storage`, whose keys are a
// closed list that this extension-only setting is not part of.
type ExtensionStorage = typeof extensionStorage

const SETTINGS_STORAGE_KEY = 'anonRpcSettings'
const DEFAULT_SETTINGS: AnonRpcSettings = { isEnabled: false, presetId: null }

/**
 * While the privacy network keeps failing, requests fail straight away with the
 * last error instead of rebooting the worker on every request.
 */
const REBOOT_COOLDOWN_MS = 5000

/**
 * The harness rejects with this message when the offscreen document hosting the
 * worker goes away. It is the one failure after `ready` that the harness reports
 * to every caller, so it is how a worker that died after booting is detected.
 */
const OFFSCREEN_DISCONNECTED_MESSAGE = 'offscreen document disconnected'

const isAbortError = (error: unknown) => error instanceof Error && error.name === 'AbortError'

const toErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

/**
 * Opt-in routing of the background's network requests through anon-rpc
 * (https://github.com/ethereum/anon-rpc): a hash-pinned anon-client, picked from
 * the presets in `ANON_RPC_PRESETS`, runs in a sandboxed worker and performs the
 * requests on the wallet's behalf, so RPC providers and Ambire's APIs do not see
 * the user's IP address.
 *
 * Off by default, and then `fetch` is the native fetch, exactly as without this
 * controller. While on, it fails closed: when the privacy network is not
 * available requests are rejected, never silently sent directly.
 */
export class AnonRpcController extends EventEmitter {
  isReady: boolean = false

  /** Only Chromium browsers implement the offscreen documents the harness needs. */
  isSupported: boolean = typeof browser?.offscreen?.createDocument === 'function'

  isEnabled: boolean = DEFAULT_SETTINGS.isEnabled

  selectedPresetId: string | null = DEFAULT_SETTINGS.presetId

  presets: AnonRpcPreset[]

  /** Set when some of the env-configured presets could not be used. */
  presetsError: string | null

  status: AnonRpcStatus = 'off'

  statusError: string | null = null

  initialLoadPromise: Promise<void>

  #storage: ExtensionStorage

  #bootstrapProvider: RpcProvider

  #worker: AnonRpcWorker | null = null

  #lastBootAt: number = 0

  constructor({
    eventEmitterRegistry,
    storage,
    presetsEnvValue = process.env.ANON_RPC_PRESETS,
    bootstrapProvider = createBootstrapProvider()
  }: {
    eventEmitterRegistry: IEventEmitterRegistryController
    storage: ExtensionStorage
    presetsEnvValue?: string
    bootstrapProvider?: RpcProvider
  }) {
    super(eventEmitterRegistry)

    this.#storage = storage
    this.#bootstrapProvider = bootstrapProvider
    const { presets, error } = parseAnonRpcPresets(presetsEnvValue)
    this.presets = presets
    this.presetsError = error
    if (error) console.error(`[AnonRpcController] ${error}`)

    this.initialLoadPromise = this.#load()
  }

  async #load(): Promise<void> {
    try {
      const stored: AnonRpcSettings = await this.#storage.get(
        SETTINGS_STORAGE_KEY,
        DEFAULT_SETTINGS
      )
      // A preset saved on a build whose presets no longer include it is not swapped for
      // another one (which could be less private): no preset is selected, so while the
      // option is on requests fail closed and settings asks the user to choose again.
      this.selectedPresetId = stored.presetId
        ? (this.#findPreset(stored.presetId)?.id ?? null)
        : (this.presets[0]?.id ?? null)
      this.isEnabled = this.isSupported && stored.isEnabled
    } catch (error) {
      // Nothing was enabled yet as far as this run knows, so requests go out directly,
      // but the user is told the setting could not be read.
      this.emitError({
        level: 'major',
        message:
          'Your privacy network setting could not be loaded, so requests are being sent directly. Try reopening the extension.',
        error: error instanceof Error ? error : new Error(String(error))
      })
    }

    if (this.isEnabled) this.#bootWorker()
    this.isReady = true
    this.emitUpdate()
  }

  get selectedPreset(): AnonRpcPreset | null {
    return this.#findPreset(this.selectedPresetId)
  }

  #findPreset(presetId: string | null): AnonRpcPreset | null {
    if (!presetId) return null
    return this.presets.find((preset) => preset.id === presetId) ?? null
  }

  async #saveSettings() {
    const settings: AnonRpcSettings = {
      isEnabled: this.isEnabled,
      presetId: this.selectedPresetId
    }
    await this.#storage.set(SETTINGS_STORAGE_KEY, settings)
  }

  async setEnabled(isEnabled: boolean) {
    await this.initialLoadPromise
    if (isEnabled && !this.isSupported) return

    this.isEnabled = isEnabled
    await this.#saveSettings()
    if (isEnabled) this.#bootWorker()
    else this.#stopWorker()
    this.emitUpdate()
  }

  async selectPreset(presetId: string) {
    await this.initialLoadPromise
    if (!this.#findPreset(presetId) || presetId === this.selectedPresetId) return

    this.selectedPresetId = presetId
    await this.#saveSettings()
    if (this.isEnabled) this.#bootWorker()
    this.emitUpdate()
  }

  retry() {
    if (!this.isEnabled) return

    this.#bootWorker()
    this.emitUpdate()
  }

  /**
   * The fetch the background uses for everything routed through this controller.
   * Waits for the saved setting first, so no request can slip out directly while
   * it is still being read at startup.
   */
  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    await this.initialLoadPromise
    if (!this.isEnabled) return globalThis.fetch(input, init)

    const worker = this.#getWorker()
    try {
      return await worker.fetch(input, init)
    } catch (error) {
      if (!isAbortError(error) && toErrorMessage(error) === OFFSCREEN_DISCONNECTED_MESSAGE) {
        this.#onWorkerFailed(worker, error)
      }
      throw error
    }
  }

  /** Whether requests currently go through the privacy network, once settings have loaded. */
  async isRouting(): Promise<boolean> {
    await this.initialLoadPromise
    return this.isEnabled
  }

  #getWorker(): AnonRpcWorker {
    const canReboot = Date.now() - this.#lastBootAt > REBOOT_COOLDOWN_MS
    if (!this.#worker && canReboot) this.#bootWorker()
    if (!this.#worker) {
      throw new Error(
        this.statusError || 'The privacy network is not available right now. Try again shortly.'
      )
    }
    return this.#worker
  }

  #bootWorker() {
    this.#stopWorker()
    this.#lastBootAt = Date.now()

    const preset = this.selectedPreset
    if (!preset) {
      this.status = 'failed'
      this.statusError = this.presets.length
        ? 'Choose a privacy network in settings to keep using the wallet with this option on.'
        : 'No privacy networks are set up in this build of the extension, so requests are blocked. Turn this option off to continue.'
      this.emitUpdate()
      return
    }

    // The offscreen document keeps booted workers alive across service worker
    // restarts and hands the same one back (`reuse`), so booting again is cheap.
    const worker = new AnonRpcWorker({
      address: preset.specifier,
      config: preset.config,
      preExisting: { rpcProvider: this.#bootstrapProvider }
    })
    this.#worker = worker
    this.status = 'connecting'
    this.statusError = null
    this.emitUpdate()

    worker.ready.then(
      () => {
        if (this.#worker !== worker) return
        this.status = 'connected'
        this.emitUpdate()
      },
      (error) => this.#onWorkerFailed(worker, error)
    )
  }

  #stopWorker() {
    const worker = this.#worker
    this.#worker = null
    this.status = 'off'
    this.statusError = null
    worker?.close()
  }

  #onWorkerFailed(worker: AnonRpcWorker, error: unknown) {
    // A failure of a worker that has since been replaced or closed is expected
    if (this.#worker !== worker) return

    this.#worker = null
    this.status = 'failed'
    this.statusError = `Could not connect to the privacy network (${toErrorMessage(error)}). Requests are blocked until it is back.`
    // Shown in settings through `statusError`; not a crash, so not reported
    this.emitError({
      level: 'silent',
      sendCrashReport: false,
      message: this.statusError,
      error: error instanceof Error ? error : new Error(String(error))
    })
    this.emitUpdate()
  }

  toJSON(): this & { emittedErrors: ErrorRef[] } {
    return {
      ...this,
      ...super.toJSON(),
      selectedPreset: this.selectedPreset
    }
  }
}

export default AnonRpcController
