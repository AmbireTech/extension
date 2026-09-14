import { EventEmitter as Emitter } from 'events'

import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { MainController } from '@ambire-common/controllers/main/main'
import { Fetch } from '@ambire-common/interfaces/fetch'
import { UiManager, View } from '@ambire-common/interfaces/ui'
import { getAccountKeysCount } from '@ambire-common/libs/keys/keys'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import { APP_VERSION, isAndroid, isDev } from '@common/config/env'
import { AutoLockController } from '@common/controllers/auto-lock'
import { WalletStateController } from '@common/controllers/wallet-state'
import LedgerSigner from '@common/modules/hardware-wallet/libs/LedgerSigner'
import TrezorSigner from '@common/modules/hardware-wallet/libs/TrezorSigner'
import QrHardwareController from '@common/modules/hardware-wallets/controllers/QrHardwareController'
import UrQrProtocolAdapter from '@common/modules/hardware-wallets/qr/protocol/UrQrProtocolAdapter'
import NfcHardwareSigner from '@common/modules/hardware-wallets/signers/NfcHardwareSigner'
import QrHardwareSigner from '@common/modules/hardware-wallets/signers/QrHardwareSigner'
import { resolveViewRoute } from '@common/modules/router/helpers'
import { storage } from '@common/services/storage'
import { Action, MethodAction } from '@common/types/actions'
import { attachBalanceHint, getAppInstanceId, isAmbireApiUrl } from '@common/utils/analytics'
import { handleActions } from '@mobile/handlers/handleActions'
import LedgerController from '@mobile/modules/hardware-wallet/controllers/LedgerController'
import NfcController from '@mobile/modules/hardware-wallet/controllers/NfcController'
import TrezorController from '@mobile/modules/hardware-wallet/controllers/TrezorController'
import { bootProfiler } from '@mobile/services/bootProfiler/bootProfiler'
import { BOOT_MARK } from '@mobile/services/bootProfiler/constants'

import { buildStateForFE, queueCtrlStateIfGated, setCriticalControllers } from './bootPhase'
import {
  emitCtrlError,
  emitCtrlUpdate,
  emitNavigate,
  emitOneTimeData,
  emitToast,
  requestWindowAction
} from './uiEvents'

export type ControllerHostConfig = {
  APP_VERSION: string
  RELAYER_URL: string
  VELCRO_URL: string
  LIFI_EXPLORER_URL: string
  BUNGEE_API_KEY: string
  UNISWAP_API_KEY: string
  criticalControllers: string[]
}

// Sent as the x-app-version header on the requests to Ambire APIs. Same shape as the
// extension's `extension-<version>-<engine>`, so the analytics can tell the apps and
// their platforms apart.
const APP_VERSION_HEADER = `mobile-${APP_VERSION}-${isAndroid ? 'android' : 'ios'}`
// Sent as the x-app-env header. No staging builds on mobile, so the value set is the
// extension's minus 'next'.
const APP_ENV_HEADER = isDev ? 'dev' : 'prod'

// The highest balance seen per account, because a request firing while the portfolio is
// still loading would otherwise under-report it in the balance hint.
const userBalances: Record<string, number> = {}

/**
 * The fetch handed to the controllers. Only the internal Ambire APIs get the analytics
 * headers and params - requests to 3rd parties must never carry anything that identifies
 * the app instance. Resolved per request, because the keystore uid, the invite code and
 * the balance are not available at boot; a request fired before the keystore is
 * constructed goes out with an empty source, same as in the extension.
 */
const fetchWithAnalytics: Fetch = (input, init) => {
  const url = input.toString()
  if (!isAmbireApiUrl(url)) return fetch(input as any, init as any) as any

  // Optional all the way down, because a request can fire while the controllers are
  // still being constructed
  const currentAccount = mainCtrl?.selectedAccount?.account
  const currentBalance = mainCtrl?.selectedAccount?.portfolio?.totalBalance || 0
  if (currentAccount && (userBalances[currentAccount.addr] || 0) < currentBalance)
    userBalances[currentAccount.addr] = currentBalance

  // The balance hint is worth attaching only if the user has keys for the account
  const hasCurrentAccountKeys =
    !!mainCtrl &&
    !!currentAccount &&
    !!getAccountKeysCount({
      accountAddr: currentAccount.addr,
      keys: mainCtrl.keystore.keys,
      accounts: mainCtrl.accounts.accounts
    })

  const urlWithHint =
    currentAccount && hasCurrentAccountKeys
      ? attachBalanceHint(url, currentAccount.addr, userBalances[currentAccount.addr] || 0)
      : url

  return fetch(urlWithHint, {
    ...(init as any),
    // Applied last, so that the caller can never overwrite the analytics data
    headers: {
      ...(init?.headers as Record<string, string>),
      'x-app-source': getAppInstanceId(
        mainCtrl?.keystore?.keyStoreUid || null,
        mainCtrl?.invite?.verifiedCode || ''
      ),
      'x-app-version': APP_VERSION_HEADER,
      'x-app-env': APP_ENV_HEADER
    }
  }) as any
}

const ctrlOnUpdateIsDirtyFlags: Record<string, boolean> = {}

function debounceFrontEndEventUpdatesOnSameTick(
  ctrlName: string,
  ctrl: any,
  forceEmit?: boolean
): 'DEBOUNCED' | 'EMITTED' {
  const sendUpdate = () => {
    // Paused dynamic controllers may finish async work after being replaced.
    // Re-resolve the live controller from the registry instead of using the
    // captured `ctrl` so a stale/removed instance never streams to the UI.
    const registeredCtrl = eventEmitterRegistry.values().find((c) => c.name === ctrlName)
    if (!registeredCtrl) return

    emitCtrlUpdate(ctrlName, buildStateForFE(ctrlName, registeredCtrl), forceEmit)
  }

  /**
   * Bypasses both host and React batching, ensuring that the state update is
   * immediately applied at the application level.
   * forceEmit also bypasses the boot-phase deferral — it is reserved for cases where
   * the UI is actively waiting on the update (status flags driven by user actions).
   */
  if (forceEmit) {
    sendUpdate()
    return 'EMITTED'
  }

  if (queueCtrlStateIfGated(ctrlName, ctrl, forceEmit)) return 'DEBOUNCED'

  if (ctrlOnUpdateIsDirtyFlags[ctrlName]) return 'DEBOUNCED'
  ctrlOnUpdateIsDirtyFlags[ctrlName] = true

  // Debounce multiple emits in the same tick and only execute one of them
  setTimeout(() => {
    if (ctrlOnUpdateIsDirtyFlags[ctrlName]) {
      // If the toJSON method of a controller ever throws, we want to catch it here
      // otherwise the ctrlOnUpdateIsDirtyFlags flag will remain true forever and no further updates
      // will be sent to the UI for that controller
      try {
        sendUpdate()
      } catch (err) {
        ;(err as any).controllerName = ctrlName
        console.error('Debug: Failed to send update to UI for ctrl', ctrlName, err)
        emitCtrlError(ctrlName, [{ message: (err as any).message, stack: (err as any).stack }])
      }
    }
    ctrlOnUpdateIsDirtyFlags[ctrlName] = false
  }, 0)

  return 'EMITTED'
}

const eventEmitterRegistry = new EventEmitterRegistryController(() => {
  eventEmitterRegistry.values().forEach((ctrl: any) => {
    const hasOnUpdateInitialized = ctrl.onUpdateIds.includes('mobile')
    if (!hasOnUpdateInitialized) {
      ctrl.onUpdate((forceEmit: boolean) => {
        debounceFrontEndEventUpdatesOnSameTick(ctrl.name, ctrl, forceEmit)
      }, 'mobile')
    }

    const hasOnErrorInitialized = ctrl.onErrorIds.includes('mobile')
    if (!hasOnErrorInitialized) {
      ctrl.onError(() => {
        if (!ctrl.isInRegistry()) return

        emitCtrlError(ctrl.name, ctrl.emittedErrors)
      }, 'mobile')
    }
  })
})

let mainCtrl: MainController | null = null
let nextWindowId = 1
let currentWindowId = 1

const buildUiManager = (): UiManager => ({
  window: {
    open: async () => {
      currentWindowId = nextWindowId++
      // Await animation completion before resolving (mirrors chrome.windows.create).
      await requestWindowAction({ type: 'open', winId: currentWindowId })
      return {
        id: currentWindowId,
        width: 0,
        height: 0,
        left: 0,
        top: 0,
        focused: true,
        createdFromWindowId: 0
      }
    },
    focus: async () => {
      // Await confirmation before resolving (mirrors chrome.windows.update).
      await requestWindowAction({ type: 'focus', winId: currentWindowId })
      return {
        id: currentWindowId,
        width: 0,
        height: 0,
        left: 0,
        top: 0,
        focused: true,
        createdFromWindowId: 0
      }
    },
    closePopupWithUrl: async () => {},
    remove: async (winId: any) => {
      if (winId === 'popup') {
        return
      }
      const targetWinId = typeof winId === 'number' ? winId : currentWindowId
      // Await close animation completion before resolving (mirrors chrome.windows.remove).
      await requestWindowAction({ type: 'remove', winId: targetWinId })
    },
    event: new Emitter()
  },
  notification: {
    create: async () => {}
  },
  message: {
    sendToastMessage: (text: string, options: any) => emitToast(text, options),
    sendUiMessage: (params: any) => emitOneTimeData(params),
    sendNavigateMessage: (_viewId: string, route: string, params: any) =>
      emitNavigate(route, params)
  },
  // Reads `mainCtrl` when called rather than when built, because the ui manager is
  // constructed as an argument to the MainController that assigns it.
  resolveViewRoute: (view: View) => resolveViewRoute(mainCtrl!, view)
})

/**
 * Builds every controller and returns their names, which is what the UI's
 * controllerStore needs to know what to wait for. Idempotent: calling it again
 * returns the same names without rebuilding anything, so a Fast Refresh or a
 * provider remount can never produce a second MainController.
 *
 * Throws nothing — a failure during construction is reported to the UI as an
 * `Init` controller error.
 */
export const initControllerHost = (config: ControllerHostConfig): string[] => {
  if (mainCtrl) return eventEmitterRegistry.values().map((c) => c.name)

  try {
    setCriticalControllers(config.criticalControllers)

    const ledgerCtrl = new LedgerController()
    const trezorCtrl = new TrezorController()
    const qrCtrl = new QrHardwareController(new UrQrProtocolAdapter(), eventEmitterRegistry)
    // NFC cards (Keycard, ...) tap-to-sign: the controller only forwards signing to
    // the tapped card's native service, which owns the NFC radio and the credentials.
    const nfcCtrl = new NfcController()

    bootProfiler.startSpan(BOOT_MARK.rnMainCtrlConstructed)
    mainCtrl = new MainController({
      eventEmitterRegistry,
      storageAPI: storage,
      appVersion: config.APP_VERSION,
      platform: isAndroid ? 'mobile-android' : 'mobile-ios',
      fetch: fetchWithAnalytics as any,
      relayerUrl: config.RELAYER_URL,
      velcroUrl: config.VELCRO_URL,
      liFiApiKey: config.LIFI_EXPLORER_URL,
      bungeeApiKey: config.BUNGEE_API_KEY,
      uniswapApiKey: config.UNISWAP_API_KEY,
      featureFlags: {},
      keystoreSigners: {
        internal: KeystoreSigner,
        // TODO: there is a mismatch in hw signer types, it's not a big deal
        ledger: LedgerSigner,
        trezor: TrezorSigner,
        qr: QrHardwareSigner,
        nfc: NfcHardwareSigner
      } as any,
      externalSignerControllers: {
        ledger: ledgerCtrl,
        trezor: trezorCtrl,
        qr: qrCtrl,
        nfc: nfcCtrl
      } as any,
      uiManager: buildUiManager()
    })
    bootProfiler.endSpan(BOOT_MARK.rnMainCtrlConstructed)

    bootProfiler.startSpan(BOOT_MARK.rnWalletStateCtrlConstructed)

    new WalletStateController({
      eventEmitterRegistry,
      onLogLevelUpdateCallback: () => Promise.resolve(),
      storage
    })
    bootProfiler.endSpan(BOOT_MARK.rnWalletStateCtrlConstructed)

    bootProfiler.startSpan(BOOT_MARK.rnAutoLockCtrlConstructed)

    new AutoLockController(eventEmitterRegistry, () => mainCtrl!.lock(), storage)
    bootProfiler.endSpan(BOOT_MARK.rnAutoLockCtrlConstructed)

    mainCtrl.ui.addView({ id: 'default-mobile-app-view', type: 'mobile' })

    const allControllerNames = eventEmitterRegistry.values().map((c) => c.name)
    bootProfiler.mark(BOOT_MARK.rnControllersReady, { count: allControllerNames.length })

    return allControllerNames
  } catch (e: any) {
    emitCtrlError('Init', [{ message: e.message, stack: e.stack }])
    return []
  }
}

/**
 * Runs one action against the controllers. A no-op until initControllerHost has
 * built them, which matches the worker's behaviour of dropping actions dispatched
 * before it finished booting.
 */
export const dispatchToControllers = (action: MethodAction | Action) => {
  if (!mainCtrl) return

  void handleActions(action, {
    eventEmitterRegistry,
    mainCtrl,
    dispatch: dispatchToControllers
  })
}
