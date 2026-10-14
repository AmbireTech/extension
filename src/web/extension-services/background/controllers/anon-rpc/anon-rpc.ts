import { AnonRpcWorker, type RpcProvider } from '@anon-rpc/browser-extension-harness'
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { ErrorRef, IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import type { storage as extensionStorage } from '@common/services/storage'
import { browser } from '@web/constants/browserapi'

import { createBootstrapProvider } from './bootstrapProvider'
import { DEFAULT_SPECIFIER_CHAIN_ID, findSpecifierChain } from './specifierChains'
import {
  CUSTOM_NETWORK_ID,
  CustomNetwork,
  isCustomNetwork,
  parseCustomNetwork
} from './customNetwork'
import { AnonRpcPreset, parseAnonRpcPresets } from './presets'

export type AnonRpcStatus = 'off' | 'connecting' | 'connected' | 'failed'

type AnonRpcSettings = {
  isEnabled: boolean
  /** A preset id, or CUSTOM_NETWORK_ID for the user's own network */
  presetId: string | null
  customNetwork?: CustomNetwork | null
}

// The extension's storage rather than ambire-common's `Storage`, whose keys are a
// closed list that this extension-only setting is not part of.
type ExtensionStorage = typeof extensionStorage

const SETTINGS_STORAGE_KEY = 'anonRpcSettings'
const DEFAULT_SETTINGS: AnonRpcSettings = { isEnabled: false, presetId: null, customNetwork: null }

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

/**
 * The oldest Firefox the harness was measured on (ESR). There the iframe's
 * sandbox attribute is the isolation boundary, which Firefox has long had.
 */
const FIREFOX_MIN_VERSION = 140

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

  /**
   * Chromium (offscreen documents) and Firefox 140+ (the sandboxed iframe hosted
   * in the background page). Settled while the saved setting loads, because
   * Firefox's version is only available asynchronously.
   */
  isSupported: boolean = false

  isEnabled: boolean = DEFAULT_SETTINGS.isEnabled

  /** A preset id, or CUSTOM_NETWORK_ID when the user's own network is selected */
  selectedPresetId: string | null = DEFAULT_SETTINGS.presetId

  presets: AnonRpcPreset[]

  /** The network the user set up themselves, if any; selectable as CUSTOM_NETWORK_ID */
  customNetwork: CustomNetwork | null = null

  /** Set when some of the env-configured presets could not be used. */
  presetsError: string | null

  status: AnonRpcStatus = 'off'

  statusError: string | null = null

  initialLoadPromise: Promise<void>

  #storage: ExtensionStorage

  /** The provider each specifier chain is read through, created on first use. */
  #bootstrapProviderFor: (chainId: number) => RpcProvider | null

  #bootstrapProviders = new Map<number, RpcProvider>()

  #worker: AnonRpcWorker | null = null

  #lastBootAt: number = 0

  constructor({
    eventEmitterRegistry,
    storage,
    presetsEnvValue = process.env.ANON_RPC_PRESETS,
    bootstrapProviderFor = (chainId: number) => {
      const chain = findSpecifierChain(chainId)
      return chain ? createBootstrapProvider(chain.rpcUrl) : null
    }
  }: {
    eventEmitterRegistry: IEventEmitterRegistryController
    storage: ExtensionStorage
    presetsEnvValue?: string
    bootstrapProviderFor?: (chainId: number) => RpcProvider | null
  }) {
    super(eventEmitterRegistry)

    this.#storage = storage
    this.#bootstrapProviderFor = bootstrapProviderFor
    const { presets, error } = parseAnonRpcPresets(presetsEnvValue)
    this.presets = presets
    this.presetsError = error
    if (error) console.error(`[AnonRpcController] ${error}`)

    this.initialLoadPromise = this.#load()
  }

  async #detectSupport(): Promise<boolean> {
    if (typeof browser?.offscreen?.createDocument === 'function') return true
    if (typeof document === 'undefined' || typeof browser?.runtime?.getBrowserInfo !== 'function') {
      return false
    }
    const { name, version } = await browser.runtime.getBrowserInfo()
    return name === 'Firefox' && Number.parseInt(version, 10) >= FIREFOX_MIN_VERSION
  }

  async #load(): Promise<void> {
    try {
      this.isSupported = await this.#detectSupport()
    } catch (error) {
      console.error('[AnonRpcController] could not detect browser support', error)
      this.isSupported = false
    }

    try {
      const stored: AnonRpcSettings = await this.#storage.get(
        SETTINGS_STORAGE_KEY,
        DEFAULT_SETTINGS
      )
      this.customNetwork = isCustomNetwork(stored.customNetwork) ? stored.customNetwork : null
      // A preset saved on a build whose presets no longer include it is not swapped for
      // another one (which could be less private): no preset is selected, so while the
      // option is on requests fail closed and settings asks the user to choose again.
      this.selectedPresetId = stored.presetId
        ? (this.#findNetwork(stored.presetId)?.id ?? null)
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

  /** The network requests go through while enabled: a preset or the user's own network. */
  get selectedNetwork(): AnonRpcPreset | null {
    return this.#findNetwork(this.selectedPresetId)
  }

  #findNetwork(networkId: string | null): AnonRpcPreset | null {
    if (!networkId) return null
    if (networkId === CUSTOM_NETWORK_ID) {
      return this.customNetwork
        ? { id: CUSTOM_NETWORK_ID, label: 'Custom network', ...this.customNetwork }
        : null
    }
    return this.presets.find((preset) => preset.id === networkId) ?? null
  }

  async #saveSettings() {
    const settings: AnonRpcSettings = {
      isEnabled: this.isEnabled,
      presetId: this.selectedPresetId,
      customNetwork: this.customNetwork
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
    if (!this.#findNetwork(presetId) || presetId === this.selectedPresetId) return

    this.selectedPresetId = presetId
    await this.#saveSettings()
    if (this.isEnabled) this.#bootWorker()
    this.emitUpdate()
  }

  /**
   * Saves the user's own network and switches to it. `configText` is free-form
   * JSON5 (or empty), passed to the network as its config; `chainId` is the chain
   * its specifier contract lives on (Ethereum when omitted).
   */
  async setCustomNetwork(specifier: string, configText: string, chainId?: number) {
    await this.initialLoadPromise
    const { network, errors } = parseCustomNetwork(specifier, configText, chainId)
    if (!network) {
      // The settings form validates the same way before saving, so this is a safety net
      this.emitError({
        level: 'expected',
        message: `Your custom privacy network was not saved. ${Object.values(errors).join(' ')}`,
        error: new Error('Invalid custom privacy network')
      })
      return
    }

    this.customNetwork = network
    this.selectedPresetId = CUSTOM_NETWORK_ID
    await this.#saveSettings()
    // Reconnect even when this network was already selected, so edits take effect
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

    const preset = this.selectedNetwork
    if (!preset) {
      this.status = 'failed'
      this.statusError =
        'Choose a privacy network in settings to keep using the wallet with this option on.'
      this.emitUpdate()
      return
    }

    const rpcProvider = this.#getBootstrapProvider(preset.chainId ?? DEFAULT_SPECIFIER_CHAIN_ID)
    if (!rpcProvider) {
      // Presets and the custom form only accept supported chains, so this is a safety net
      this.status = 'failed'
      this.statusError =
        'This privacy network is set up on a blockchain the wallet can’t look it up on. Choose another network.'
      this.emitUpdate()
      return
    }

    // On Chromium the offscreen document keeps booted workers alive across service
    // worker restarts and hands the same one back (`reuse`), so booting again is
    // cheap. On Firefox the worker lives in this background page, so each boot is
    // fresh (and an event page suspension means booting again on wake).
    const worker = new AnonRpcWorker({
      address: preset.specifier,
      config: preset.config,
      preExisting: { rpcProvider }
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

  #getBootstrapProvider(chainId: number): RpcProvider | null {
    const cached = this.#bootstrapProviders.get(chainId)
    if (cached) return cached
    const provider = this.#bootstrapProviderFor(chainId)
    if (provider) this.#bootstrapProviders.set(chainId, provider)
    return provider
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
      selectedNetwork: this.selectedNetwork
    }
  }
}

export default AnonRpcController
