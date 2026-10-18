// We include `setImmediate` because ethers / viem cryptographic operations
// (e.g. scrypt keystore unlock) rely on it for fast cooperative scheduling —
// without it they fall back to slower timers and performance drops significantly.
//
// It is imported in background for development builds, and injected via Webpack
// plugin for production where LavaMoat + SES isolate modules and harden intrinsics.
import 'setimmediate'
// Must stay the first import: it patches a global needed at module-evaluation time - see the file
import './kohakuShims'

import { nanoid } from 'nanoid'

import EmittableError from '@ambire-common/classes/EmittableError'
import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { EventEmitterRegistryController } from '@ambire-common/controllers/eventEmitterRegistry/eventEmitterRegistry'
import { MainController } from '@ambire-common/controllers/main/main'
import { Fetch, RequestInitWithCustomHeaders } from '@ambire-common/interfaces/fetch'
import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { ISelectedAccountController } from '@ambire-common/interfaces/selectedAccount'
import { NavigateOptions, UiManager, View } from '@ambire-common/interfaces/ui'
import { getAccountKeysCount } from '@ambire-common/libs/keys/keys'
import { createProverFactory } from '@ambire-common/libs/privacyPools/prover'
import { KeystoreSigner } from '@ambire-common/libs/keystoreSigner/keystoreSigner'
import { parse, stringify } from '@ambire-common/libs/richJson/richJson'
import { openAmbireIdb } from '@ambire-common/services/storage/idbDatabase'
import { AMBIRE_IDB_SCHEMA } from '@ambire-common/services/storage/idbSchema'
import wait from '@ambire-common/utils/wait'
import {
  excludeIntegrationsByName,
  getCrashReportAccountAddr,
  getCrashReportUserId,
  getReportableAction,
  logSentryDeliveryWhenTesting,
  reportControllerError
} from '@common/config/analytics/crashReportHelpers'
import { processCrashReportEvent } from '@common/config/analytics/processCrashReportEvent'
import CONFIG, { APP_VERSION, isAmbireNext, isDev, isProd } from '@common/config/env'
import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'
import { CULTURE_CONTEXT_INTEGRATION_NAME } from '@common/constants/crashAnalytics'
import { AutoLockController } from '@common/controllers/auto-lock'
import { WalletStateController } from '@common/controllers/wallet-state'
import LedgerSigner from '@common/modules/hardware-wallet/libs/LedgerSigner'
import TrezorSigner from '@common/modules/hardware-wallet/libs/TrezorSigner'
import QrHardwareController from '@common/modules/hardware-wallets/controllers/QrHardwareController/QrHardwareController'
import UrQrProtocolAdapter from '@common/modules/hardware-wallets/qr/protocol/UrQrProtocolAdapter'
import QrHardwareSigner from '@common/modules/hardware-wallets/signers/QrHardwareSigner'
import handleProviderRequests from '@common/modules/provider/handleProviderRequests'
import { resolveViewRoute } from '@common/modules/router/helpers'
import { storage } from '@common/services/storage'
import { Action, MethodAction } from '@common/types/actions'
import { attachBalanceHint, getAppInstanceId, isAmbireApiUrl } from '@common/utils/analytics'
import { LOG_LEVELS, logInfoWithPrefix } from '@common/utils/logger'
import { serializeControllerForUI } from '@common/utils/serializeControllerForUI'
import {
  BROWSER_EXTENSION_LOG_UPDATED_CONTROLLER_STATE_ONLY,
  BROWSER_EXTENSION_MEMORY_INTENSIVE_LOGS,
  BUNGEE_API_KEY,
  COWSWAP_API_KEY,
  LI_FI_API_KEY,
  RELAYER_URL,
  UNISWAP_API_KEY,
  VELCRO_URL
} from '@env'
import * as Sentry from '@sentry/browser'
import { browser, engine, platform } from '@web/constants/browserapi'
import { BadgesController } from '@web/extension-services/background/controllers/badges'
import ExtensionUpdateController from '@web/extension-services/background/controllers/extension-update'
import { getRequestToMoveOutOfPanel } from '@web/extension-services/background/handlers/getRequestToMoveOutOfPanel'
import { handleActions } from '@web/extension-services/background/handlers/handleActions'
import { handleCleanUpOnPortDisconnect } from '@web/extension-services/background/handlers/handleCleanUpOnPortDisconnect'
import { handleKeepAlive } from '@web/extension-services/background/handlers/handleKeepAlive'
import {
  handleKeepBridgeContentScriptAcrossSessions,
  handleRegisterScripts
} from '@web/extension-services/background/handlers/handleScripting'
import { notificationManager } from '@web/extension-services/background/webapi/notification'
import {
  canUseOffscreenProver,
  createOffscreenProverFactory
} from '@web/extension-services/privacy-pools-prover/offscreenProverFactory'
import {
  canUseOffscreenTornadoCash,
  createOffscreenTornadoCashPluginFactory
} from '@web/extension-services/tornado-cash/offscreenTornadoCashPluginFactory'
import {
  getDappTabFocusDispatcher,
  getPanelManager,
  handleFirefoxActionClicked
} from '@web/extension-services/background/webapi/panel'
import windowManager from '@web/extension-services/background/webapi/window'
import {
  initializeMessenger,
  MessageMeta,
  Port,
  PortMessenger
} from '@web/extension-services/messengers'
import LatticeController from '@web/modules/hardware-wallet/controllers/LatticeController'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'
import TrezorController from '@web/modules/hardware-wallet/controllers/TrezorController'
import LatticeSigner from '@web/modules/hardware-wallet/libs/LatticeSigner'
import { providerRequestTransport } from '@web/modules/provider/providerRequestTransport'
import { isExtensionOverlayPort } from '@web/utils/sidePanel'

import {
  captureBackgroundException,
  CRASH_ANALYTICS_BACKGROUND_CONFIG,
  setBackgroundExtraContext,
  setBackgroundUserContext
} from './CrashAnalytics'
import { sendCriticalControllerStates } from './criticalControllerStates'

const debugLogs: {
  key: string
  value: object
}[] = []

function stateDebug(
  logLevel: LOG_LEVELS,
  stateToLog: object,
  ctrlName: string,
  type: 'update' | 'error'
) {
  // In production, we avoid logging the complete state because `parse(stringify(stateToLog))` can be CPU-intensive.
  // This is especially true for the main controller, which includes all sub-controller states.
  // For example, the portfolio state for a single account can exceed 2.0MB, and `parse(stringify(portfolio))`
  // can take over 100ms to execute. With multiple consecutive updates, this can add up to over a second,
  // causing the extension to slow down or freeze.
  // Instead of logging with `logInfoWithPrefix` in production, we rely on EventEmitter.emitError() to log individual errors
  // (instead of the entire state) to the user console, which aids in debugging without significant performance costs.
  if (logLevel === LOG_LEVELS.PROD) return
  if (!stateToLog) return

  const clonedState = parse(stringify(stateToLog))

  const now = new Date()
  const timeWithMs = `${now.toLocaleTimeString('en-US', { hour12: false })}.${now
    .getMilliseconds()
    .toString()
    .padStart(3, '0')}`

  const key =
    type === 'error'
      ? `${ctrlName} ctrl emitted an error at ${timeWithMs}`
      : `${ctrlName} ctrl emitted an update at ${timeWithMs}`

  if (BROWSER_EXTENSION_MEMORY_INTENSIVE_LOGS === 'true' && isDev) {
    logInfoWithPrefix(key, clonedState)
    return
  }

  debugLogs.unshift({
    key,
    value: clonedState
  })

  if (debugLogs.length > 200) {
    debugLogs.pop()
  }

  logInfoWithPrefix(key, debugLogs)
}

/**
 * How many times the background tries to open IndexedDB before settling for the key-value
 * fallback. Two, not more: a second attempt covers a slow open, and every further one only
 * adds its own deadline to the boot for a failure that is not going to clear.
 */
const IDB_OPEN_ATTEMPTS = 2

const PRIVACY_POOLS_CONTROLLER_NAME = 'PrivacyPoolsController'

/** Controllers whose errors reach Sentry with only their type and stack - see `beforeSend`. */
const PRIVATE_ACCOUNT_CONTROLLER_NAMES = [PRIVACY_POOLS_CONTROLLER_NAME, 'TornadoCashController']

let isInitialized = false
const bridgeMessenger = initializeMessenger({ connect: 'inpage' })
let mainCtrl: MainController
let walletStateCtrl: WalletStateController
let autoLockCtrl: AutoLockController
// Hoisted so the `onConnect` listener below (which must be registered synchronously at the
// top level of the script - see the comment above it) can close over them once `init()` has
// assigned them, instead of the listener itself living inside `init()`'s local scope.
let pm: PortMessenger
let ledgerCtrl: LedgerController
let trezorCtrl: TrezorController
let qrCtrl: QrHardwareController
let eventEmitterRegistry: EventEmitterRegistryController

// Initialize Sentry early to set up global error handlers during initial script evaluation
if (CONFIG.SENTRY_DSN_BROWSER_EXTENSION) {
  Sentry.init({
    ...CRASH_ANALYTICS_BACKGROUND_CONFIG,
    integrations: (defaultIntegrations) => [
      ...excludeIntegrationsByName(defaultIntegrations, [CULTURE_CONTEXT_INTEGRATION_NAME]),
      Sentry.extraErrorDataIntegration()
    ],
    beforeSend(event, hint) {
      const processedEvent = processCrashReportEvent(event, hint.originalException)
      if (!processedEvent) return null

      // Privacy Pools and Tornado Cash errors, their logs and the requests before them can hold
      // the recipient, amounts or notes, and the user ID would link them to the install, so only
      // the error's type and stack are sent.
      const controllerName = processedEvent.extra?.controllerName
      if (
        typeof controllerName === 'string' &&
        PRIVATE_ACCOUNT_CONTROLLER_NAMES.includes(controllerName)
      ) {
        delete processedEvent.breadcrumbs
        delete processedEvent.user
        delete processedEvent.contexts
        delete processedEvent.message
        processedEvent.extra = { controllerName }
        processedEvent.exception?.values?.forEach((exception) => {
          delete exception.value
        })
      }

      // We don't want to miss errors that occur before the controllers are initialized.
      // processCrashReportEvent has already scrubbed it -- only the crashAnalyticsEnabled gate below,
      // which depends on walletStateCtrl, can't run yet.
      if (!walletStateCtrl) return processedEvent

      if (isDev) {
        console.log(`Sentry event captured in background: ${event.event_id}`, processedEvent)
      }

      // If the Sentry is disabled, we don't send any events
      return walletStateCtrl?.crashAnalyticsEnabled ? processedEvent : null
    }
  })

  logSentryDeliveryWhenTesting(Sentry.getClient())
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
handleRegisterScripts()
handleKeepAlive()

// eslint-disable-next-line @typescript-eslint/no-floating-promises
providerRequestTransport.reply(async ({ method, id, providerId, params }, meta) => {
  // wait for mainCtrl to be initialized before handling dapp requests
  while (!mainCtrl || !walletStateCtrl) await wait(200)
  // ...and for the stored settings, as the side panel mode decides whether a request is shown in an
  // open side panel - until it loads it reads as off (e.g. right after a browser restart)
  // (Never rejects - settings that fail to load keep their defaults)
  await walletStateCtrl.initialLoadPromise

  const senderTab = meta.sender?.tab
  const tabId = senderTab?.id
  const windowId = senderTab?.windowId
  if (!senderTab || tabId === undefined || windowId === undefined || !meta.sender?.url) {
    return
  }

  const session = await mainCtrl.dapps.getOrCreateDappSession({
    tabId,
    windowId,
    url: meta.sender.url,
    // SECURITY: `frameId` and `tab.url` come from the browser, not from the page, so an embedded
    // dApp cannot lie about sitting inside a phishing top-level document. `sender.url` is the
    // requesting frame's URL, while `sender.tab.url` is the tab's top-level document URL.
    // Default to the top frame when the browser omits `frameId`, so the frame context is always
    // refreshed on the extension - leaving it undefined would preserve a previous visit's value.
    frameId: meta.sender.frameId ?? 0,
    topFrameUrl: senderTab.url
  })

  await mainCtrl.dapps.initialLoadPromise
  mainCtrl.dapps.setSessionMessenger(session.sessionId, bridgeMessenger, isAmbireNext)

  try {
    const res = await handleProviderRequests({
      request: { method, params, session },
      mainCtrl,
      walletStateCtrl,
      autoLockCtrl,
      requestId: id,
      providerId,
      notificationManager
    })

    return { id, providerId, result: res }
  } catch (error: any) {
    let errorRes
    try {
      errorRes = error.serialize()
    } catch (e) {
      errorRes = error
    }
    return { id, providerId, error: errorRes }
  }
})

handleKeepBridgeContentScriptAcrossSessions()

const init = async () => {
  if (isInitialized) return
  isInitialized = true

  if (process.env.IS_TESTING === 'true') await setupStorageForTesting()

  if (browser.storage.local?.setAccessLevel) {
    try {
      await browser.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })
    } catch (err) {
      captureBackgroundException(err)
      console.error(err)
    }
  }

  const backgroundState: {
    isUnlocked: boolean
    ctrlOnUpdateIsDirtyFlags: { [key: string]: boolean }
    autoLockIntervalId?: ReturnType<typeof setInterval>
    userBalances: Record<string, number>
  } = {
    /**
      ctrlOnUpdateIsDirtyFlags will be set to true for a given ctrl when it receives an update in the ctrl.onUpdate callback.
      While the flag is truthy and there are new updates coming for that ctrl in the same tick, they will be debounced and only one event will be executed at the end
    */
    isUnlocked: false,
    ctrlOnUpdateIsDirtyFlags: {},
    // used for caching the biggest seen user balance so we can later send it to cena
    // further commented down below
    userBalances: {}
  }

  pm = new PortMessenger()
  ledgerCtrl = new LedgerController(
    () => !!mainCtrl?.featureFlags.isFeatureEnabled('ledgerSigningReports')
  )
  trezorCtrl = new TrezorController(windowManager as UiManager['window'])
  const latticeCtrl = new LatticeController()

  // Skip adding custom headers and URL modifications for 3rd party URLs
  // (only internal Ambire APIs need the x-app-* headers and tracking params)
  // @ts-ignore
  const fetchWithAnalytics: Fetch = (url, init) => {
    if (!isAmbireApiUrl(url.toString())) {
      // @ts-ignore
      return fetch(url, init)
    }

    // As of v4.26.0, custom internal headers. The mobile app sends the same ones from
    // its worker (see decorateAmbireApiRequest there).
    const initWithCustomHeaders: RequestInitWithCustomHeaders = init || { headers: {} }
    initWithCustomHeaders.headers = initWithCustomHeaders.headers || {}
    // Set here rather than as a default for a missing init, so that it is sent no matter
    // whether the caller passed an init of its own (most of them do)
    initWithCustomHeaders.headers['x-app-env'] = isAmbireNext ? 'next' : isDev ? 'dev' : 'prod'

    // if the fetch method is called while the keystore is constructing the keyStoreUid won't be defined yet
    // in that case we can still fetch but without our custom header
    if (mainCtrl?.keystore?.keyStoreUid) {
      const instanceId = getAppInstanceId(
        mainCtrl.keystore.keyStoreUid,
        mainCtrl.invite?.verifiedCode || ''
      )

      initWithCustomHeaders.headers['x-app-source'] = instanceId
      const versionHeader = `extension-${APP_VERSION}-${process.env.WEB_ENGINE}`
      initWithCustomHeaders.headers['x-app-version'] = versionHeader
    }

    // The balance hint (see attachBalanceHint) is worth attaching only if the user has
    // keys for the account. The highest balance seen is kept, because a request firing
    // while the portfolio is still loading would otherwise under-report it.
    const currentAccount = mainCtrl.selectedAccount.account
    const hasCurrentAccountKeys =
      currentAccount &&
      getAccountKeysCount({
        accountAddr: currentAccount.addr,
        keys: mainCtrl.keystore.keys,
        accounts: mainCtrl.accounts.accounts
      })
    const currentBalance = mainCtrl.selectedAccount.portfolio.totalBalance
    if (
      currentAccount &&
      (backgroundState.userBalances[currentAccount?.addr] || 0) < currentBalance
    )
      backgroundState.userBalances[currentAccount?.addr] = currentBalance

    if (currentAccount && hasCurrentAccountKeys)
      url = attachBalanceHint(
        url.toString(),
        currentAccount.addr,
        backgroundState.userBalances[currentAccount.addr] || 0
      )

    // Use the native fetch (instead of node-fetch or whatever else) since
    // browser extensions are designed to run within the web environment,
    // which already provides a native and well-optimized fetch API.
    // @ts-ignore
    return fetch(url, initWithCustomHeaders)
  }

  eventEmitterRegistry = new EventEmitterRegistryController(() => {
    eventEmitterRegistry.values().forEach((ctrl) => {
      const hasOnUpdateInitialized = ctrl.onUpdateIds.includes('background')
      if (!hasOnUpdateInitialized) {
        ctrl.onUpdate(async (forceEmit) => {
          const res = debounceFrontEndEventUpdatesOnSameTick(ctrl.name, mainCtrl, forceEmit)
          if (res === 'DEBOUNCED') return

          if (ctrl.name === 'KeystoreController') {
            const keystoreCtrl = ctrl as IKeystoreController
            if (keystoreCtrl.isReadyToStoreKeys) {
              setBackgroundUserContext({
                id: getCrashReportUserId(keystoreCtrl, mainCtrl.invite.verifiedCode)
              })
              if (backgroundState.isUnlocked && !keystoreCtrl.isUnlocked) {
                await mainCtrl.dapps.broadcastDappSessionEvent('lock')
              } else if (!backgroundState.isUnlocked && keystoreCtrl.isUnlocked) {
                autoLockCtrl.setLastActiveTime()
                await mainCtrl.dapps.broadcastUnlock()
              }
              backgroundState.isUnlocked = keystoreCtrl.isUnlocked
            }
          }

          if (ctrl.name === 'SelectedAccountController') {
            const accountAddr = getCrashReportAccountAddr(ctrl as ISelectedAccountController)

            if (accountAddr) {
              setBackgroundExtraContext('account', accountAddr)
            }
          }
        }, 'background')
      }
    })

    //
    // Add onError listeners
    //

    eventEmitterRegistry.values().forEach((ctrl) => {
      const hasOnErrorInitialized = ctrl.onErrorIds.includes('background')

      if (!hasOnErrorInitialized) {
        ctrl.onError((error) => {
          if (!ctrl.isInRegistry()) return

          stateDebug(walletStateCtrl.logLevel, ctrl, ctrl.name, 'error')
          pm.send('> ui-error', {
            method: ctrl.name,
            // mainCtrl may not exist yet - WalletStateController is created and loads before it
            params: { errors: ctrl.emittedErrors, controller: mainCtrl?.name }
          })
          reportControllerError(error, ctrl.name, captureBackgroundException)
        }, 'background')
      }
    })
  })

  qrCtrl = new QrHardwareController(new UrQrProtocolAdapter(), eventEmitterRegistry)

  // Created before mainCtrl, whose UI manager reads the side panel mode. It doesn't need mainCtrl
  // itself - the log level callback only runs on a log level change, long after both exist.
  walletStateCtrl = new WalletStateController({
    eventEmitterRegistry,
    onLogLevelUpdateCallback: async (nextLogLevel: LOG_LEVELS) => {
      // A log level change comes from a view, which can only talk to the controllers once init()
      // has created mainCtrl - guarded anyway, as no app can be connected before that
      await mainCtrl?.dapps.broadcastDappSessionEvent('logLevelUpdate', nextLogLevel)
    },
    storage
  })

  const getIsSidePanelModeEnabled = () => walletStateCtrl.isSidePanelModeEnabled

  // Retried once, because openAmbireIdb() gives up after a second so a blocked upgrade cannot
  // hang the boot — and this is the only call, so a merely slow open (cold browser start, busy
  // disk) would otherwise put the whole service-worker lifetime on key-value, where history
  // renders from the blob frozen at migration time.
  //
  // Reported after the last attempt, not the first: this is the only signal that a user has
  // landed on the key-value fallback. The wallet stays usable — history renders from the
  // retained legacy blob — so nothing surfaces in the UI, which means without this the
  // fallback is invisible in aggregate and we could not tell whether it affects one user or
  // many. Reporting a failure the retry went on to recover from would make it useless.
  const openIdbWithRetry = async () => {
    let lastError: any
    let attempts = 0

    while (attempts < IDB_OPEN_ATTEMPTS) {
      attempts += 1
      try {
        return await openAmbireIdb()
      } catch (error: any) {
        lastError = error

        // VersionError means a database newer than this build's dbVersion, i.e. a downgrade.
        // That is not transient — a retry fails identically and only delays the boot. Any
        // other name points at the open itself failing, which a retry can still win.
        if (error?.name === 'VersionError') break
      }
    }

    console.error('[background] Failed to open IDB, activity will fall back to storage', lastError)
    captureBackgroundException(lastError, {
      extra: {
        errorName: lastError?.name,
        expectedDbVersion: AMBIRE_IDB_SCHEMA.dbVersion,
        // Fewer than IDB_OPEN_ATTEMPTS means the loop broke early on a downgrade.
        attempts
      }
    })

    return undefined
  }

  const idb = await openIdbWithRetry()

  // Copied at build time and served same-origin - see webpack/extension.js
  const privacyPoolsCircuitsBaseUrl = browser.runtime.getURL('privacy-pools-circuits/')

  mainCtrl = new MainController({
    eventEmitterRegistry,
    appVersion: APP_VERSION,
    platform,
    storageAPI: storage,
    fetch: fetchWithAnalytics,
    privacyPoolsCircuitsBaseUrl,
    // On Chrome, in an offscreen document using every core; elsewhere or if it fails, right here
    privacyPoolsProverFactory: canUseOffscreenProver()
      ? createOffscreenProverFactory({
          fallback: createProverFactory(privacyPoolsCircuitsBaseUrl),
          onError: (error) => captureBackgroundException(error)
        })
      : undefined,
    // Its SDK runs only in Web Workers, so only where an offscreen document can host it
    tornadoCashPluginFactory: canUseOffscreenTornadoCash()
      ? createOffscreenTornadoCashPluginFactory({
          onError: (error) => captureBackgroundException(error)
        })
      : undefined,
    relayerUrl: RELAYER_URL,
    velcroUrl: VELCRO_URL,
    liFiApiKey: LI_FI_API_KEY,
    cowSwapApiKey: COWSWAP_API_KEY,
    bungeeApiKey: BUNGEE_API_KEY,
    uniswapApiKey: UNISWAP_API_KEY,
    featureFlags: {},
    idb,
    keystoreSigners: {
      internal: KeystoreSigner,
      // TODO: there is a mismatch in hw signer types, it's not a big deal
      ledger: LedgerSigner,
      trezor: TrezorSigner,
      lattice: LatticeSigner,
      qr: QrHardwareSigner
    } as any,
    externalSignerControllers: {
      ledger: ledgerCtrl,
      trezor: trezorCtrl,
      lattice: latticeCtrl,
      qr: qrCtrl
    } as any,
    uiManager: {
      window: {
        ...windowManager,
        remove: async (winId: number | 'popup') => {
          if (winId === 'popup') {
            // Only the popup is closed here. The side panel can't be closed programmatically,
            // and it doesn't need to be - requests are rendered in it while it is open.
            return new Promise((resolve) => {
              const popupPort = pm.ports.find((p) => p.name === 'popup')
              if (!popupPort) {
                resolve()
                return
              }

              const timeout = setTimeout(() => {
                resolve()
              }, 1500)

              popupPort.onDisconnect.addListener(() => {
                clearTimeout(timeout)
                resolve()
              })
              pm.send('> ui', { method: 'closePopup', params: {} })
            })
          }
          await windowManager.remove(winId, pm)
        }
      },
      panel: getPanelManager(pm, getIsSidePanelModeEnabled),
      dispatchDappTabFocus: getDappTabFocusDispatcher(pm, getIsSidePanelModeEnabled),
      notification: notificationManager,
      message: {
        sendToastMessage: (text, options) => {
          pm.send('> ui-toast', { method: 'addToast', params: { text, options } })
        },
        sendUiMessage: (params) => {
          pm.send('> ui', { method: 'receiveOneTimeData', params })
        },
        sendNavigateMessage: (viewId: string, route: string, options?: NavigateOptions) => {
          // Views are keyed by the id of the port they connected with, so only the one being
          // navigated hears about it.
          const port = pm.ports.find((p) => p.id === viewId)
          if (!port) return

          pm.sendToPort(port, '> ui', { method: 'navigate', params: { route, options } })
        }
      },
      resolveViewRoute: (view: View) => resolveViewRoute(mainCtrl, view)
    }
  })

  // Load them immediately (the optimization is for mobile only)
  void mainCtrl.phishing.init()
  void mainCtrl.dapps.init()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const badgesCtrl = new BadgesController(mainCtrl, walletStateCtrl)

  // Turning side panel mode off leaves nothing to show a pending app request (Chrome closes its
  // panel, Firefox's sidebar shows the "mode off" notice), so it's moved to a request window
  let wasSidePanelModeEnabled = walletStateCtrl.isSidePanelModeEnabled
  walletStateCtrl.onUpdate(() => {
    const isSidePanelModeEnabled = walletStateCtrl.isSidePanelModeEnabled
    const hasSidePanelModeBeenTurnedOff = wasSidePanelModeEnabled && !isSidePanelModeEnabled
    wasSidePanelModeEnabled = isSidePanelModeEnabled

    if (!hasSidePanelModeBeenTurnedOff || mainCtrl.requests.requestWindow.windowProps) return

    const requestToMove = getRequestToMoveOutOfPanel(mainCtrl.requests.visibleUserRequests)
    if (!requestToMove) return

    mainCtrl.requests
      .setCurrentUserRequestById(requestToMove.request.id, {
        baseWindowId: requestToMove.baseWindowId
      })
      .catch((error: unknown) => {
        console.error('Failed to move a request out of the side panel', error)
        captureBackgroundException(error)
      })
  })
  autoLockCtrl = new AutoLockController(
    eventEmitterRegistry,
    () => {
      // Prevents sending multiple notifications if the event is triggered multiple times
      if (mainCtrl.keystore.isUnlocked) {
        notificationManager
          .create({
            title: 'Ambire locked',
            message: 'Your wallet has been locked due to inactivity.'
          })
          .catch((err) => {
            console.error('Failed to create notification', err)
          })
      }
      mainCtrl.lock()
    },
    storage
  )
  const extensionUpdateCtrl = new ExtensionUpdateController(eventEmitterRegistry)

  function debounceFrontEndEventUpdatesOnSameTick(
    ctrlName: string,
    mainCtrl: MainController | EventEmitter | undefined,
    forceEmit?: boolean
  ): 'DEBOUNCED' | 'EMITTED' {
    const sendUpdate = () => {
      // Paused dynamic controllers may finish async work after being replaced.
      const registeredCtrl = eventEmitterRegistry.values().find((ctrl) => ctrl.name === ctrlName)
      if (!registeredCtrl) return

      // Controller updates. We should access the state of the nested controllers
      // directly from their context instead of through the main ctrl state on the FE.
      const stateToSendToFE = serializeControllerForUI(registeredCtrl)

      pm.send('> ui', { method: ctrlName, params: stateToSendToFE, forceEmit })

      // Debug logs
      const logOnlyUpdatedState = BROWSER_EXTENSION_LOG_UPDATED_CONTROLLER_STATE_ONLY === 'true'
      let stateToLog: object = stateToSendToFE

      if (
        // If it's main we have to log the main controller itself and not the data that is sent to the UI
        // as the latter is stripped from nested controllers' states.
        ctrlName === 'MainController' ||
        // Log main if not configured otherwise, the controller is nested in main and main exists
        (!logOnlyUpdatedState && ctrlName in controllersNestedInMainMapping && mainCtrl)
      ) {
        stateToLog = mainCtrl as EventEmitter
      }

      stateDebug(walletStateCtrl.logLevel, stateToLog, ctrlName, 'update')
    }

    /**
     * Bypasses both background and React batching,
     * ensuring that the state update is immediately applied at the application level (React/Extension).
     *
     * For more info, please refer to:
     * EventEmitter.forceEmitUpdate()
     */
    if (forceEmit) {
      sendUpdate()
      return 'EMITTED'
    }

    if (backgroundState.ctrlOnUpdateIsDirtyFlags[ctrlName]) return 'DEBOUNCED'
    backgroundState.ctrlOnUpdateIsDirtyFlags[ctrlName] = true

    // Debounce multiple emits in the same tick and only execute one of them
    setTimeout(() => {
      if (backgroundState.ctrlOnUpdateIsDirtyFlags[ctrlName]) {
        // If the toJSON method of a controller ever throws, we want to catch it here
        // otherwise the ctrlOnUpdateIsDirtyFlags flag will remain true forever and no further updates
        // will be sent to the UI for that controller
        try {
          sendUpdate()
        } catch (err) {
          ;(err as any).controllerName = ctrlName
          console.error('Debug: Failed to send update to UI for ctrl', ctrlName, err)
          captureBackgroundException(err)
        }
      }
      backgroundState.ctrlOnUpdateIsDirtyFlags[ctrlName] = false
    }, 0)

    return 'EMITTED'
  }
}

const setupStorageForTesting = async () => {
  // In the testing environment, we need to slow down app initialization.
  // This is necessary to predefine the chrome.storage testing values in our Playwright tests,
  // ensuring that the Controllers are initialized with the storage correctly.
  // Once the storage is configured in Playwright, we set the `isE2EStorageSet` flag to true.
  // Here, we are waiting for its value to be set.

  const checkE2EStorage = async (): Promise<void> => {
    const isE2EStorageSet = !!(await storage.get('isE2EStorageSet', false))
    if (isE2EStorageSet) return

    await wait(100)
    await checkE2EStorage()
  }

  await checkE2EStorage()
}

// Ensures controllers are initialized as soon as the service worker starts,
// so UI ports (popup, side panel, tab) can connect without waiting for a ping.
// Kept as a promise (instead of fire-and-forget) so the `onConnect` listener below can await
// it - see the comment there for why.
// Resolves to whether `init()` succeeded - it never rejects.
const initPromise = init()
  .then(() => true)
  .catch((err) => {
    captureBackgroundException(err)
    console.error(err)
    return false
  })

// Registered synchronously here, at the top level of the script, rather than inside `init()`.
// Chrome requires MV3 event listeners to be added synchronously during the service worker's
// first, uninterrupted script evaluation to reliably catch events fired right as the worker
// wakes from suspension - `init()` yields at its first `await` before it would otherwise reach
// this listener, which is exactly the situation a UI view's reconnect after a background
// restart/suspend races against. The sender/origin check stays synchronous and unconditional
// (it's a security check and must not depend on `init()` finishing); only the rest, which needs
// `pm`/`mainCtrl`/etc., waits on `initPromise`.
// listen for messages from UI
browser.runtime.onConnect.addListener(async (port: Port) => {
  const [name, id] = port.name.split(':') as [Port['name'], Port['id']]
  if (!['popup', 'tab', 'request-window', 'side-panel'].includes(name)) return

  // These port names grant access to every controller method (exporting keys and
  // the seed phrase included), so only our own extension pages may claim them.
  const senderUrl = port.sender?.url
  const isFromOurExtension = port.sender?.id === browser.runtime.id
  const isFromExtensionPage = !senderUrl || senderUrl.startsWith(browser.runtime.getURL(''))

  if (!isFromOurExtension || !isFromExtensionPage) {
    port.disconnect()
    return
  }

  // The view can close while `init()` is still running. Its onDisconnect would then fire before
  // the PortMessenger listener below exists, leaving a dead port registered for good.
  let disconnectedWhileWaitingForInit = false
  const onDisconnectWhileWaitingForInit = () => {
    disconnectedWhileWaitingForInit = true
  }
  port.onDisconnect.addListener(onDisconnectWhileWaitingForInit)
  const isInitSuccessful = await initPromise
  port.onDisconnect.removeListener(onDisconnectWhileWaitingForInit)
  if (disconnectedWhileWaitingForInit) return

  // A failed `init()` can leave `pm`/`mainCtrl` etc. unassigned or only partially assigned.
  if (!isInitSuccessful) {
    port.disconnect()
    return
  }

  port.id = id || nanoid()

  port.name = name
  pm.addOrUpdatePort(port, () => {
    mainCtrl.ui.addView({ id: port.id, type: port.name })

    // Registering the view is what sends it to a screen, so give it the states that screen
    // needs at the same time instead of making it ask.
    sendCriticalControllerStates({ pm, port, eventEmitterRegistry }).catch(
      captureBackgroundException
    )
    if (isExtensionOverlayPort(port.name)) {
      mainCtrl.onPopupOpen(port.id).catch((error) => {
        console.error('Failed to initialize overlay view', error)
      })
    }

    pm.addConnectListener(
      port.id,
      // @ts-ignore
      async (messageType, action: MethodAction | Action, meta: MessageMeta = {}) => {
        const { type } = action
        const { windowId } = meta

        try {
          if (messageType === '> background' && type) {
            await handleActions(action, { pm, port, eventEmitterRegistry, mainCtrl, meta })
          }
        } catch (err: any) {
          console.error(`${type} action failed:`, err)
          captureBackgroundException(err, {
            extra: {
              action: stringify(getReportableAction(action)),
              portId: port.id,
              windowId
            }
          })
          const shortenedError =
            err.message.length > 150 ? `${err.message.slice(0, 150)}...` : err.message

          let message = `Something went wrong! Please contact support. Error: ${shortenedError}`
          // Emit the raw error only if it's a custom error
          if (err instanceof EmittableError || err instanceof ExternalSignerError) {
            message = err.message
          }

          pm.send('> ui-error', {
            method: type,
            params: {
              errors: [
                {
                  message,
                  level: 'major',
                  error: err
                }
              ]
            }
          })
        }
      }
    )

    pm.addDisconnectListener(port.id, (disconnectedPort) => {
      mainCtrl.ui.removeView(port.id)
      // Not awaited - nothing below depends on the cleanup finishing
      handleCleanUpOnPortDisconnect({
        port,
        mainCtrl,
        isSidePanelModeEnabled: walletStateCtrl.isSidePanelModeEnabled
      }).catch((error: unknown) => {
        console.error('Failed to clean up after a disconnected view', error)
        captureBackgroundException(error)
      })

      // The selectedAccount portfolio is reset onLoad of the popup
      // (from the background) while the portfolio update is triggered
      // by a useEffect. If that useEffect doesn't trigger, the portfolio
      // state will remain reset until an automatic update is triggered.
      // Example: the user has the dashboard opened in tab, opens the popup
      // and closes it immediately.
      if (isExtensionOverlayPort(disconnectedPort.name)) mainCtrl.portfolio.forceEmitUpdate()
      if (disconnectedPort.name === 'tab' || disconnectedPort.name === 'request-window') {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        ledgerCtrl.cleanUp()
        trezorCtrl.cleanUp()
        qrCtrl.signingCleanup()
      }
    })
  })
})

// Firefox's toolbar click (see handleFirefoxActionClicked). Registered here because no UI page
// bundles background.ts - registering it from a UI page too (panel.ts is also imported by UI code)
// breaks Firefox's extension messaging: every later `browser.*` call hangs.
if (engine === 'gecko') {
  browser.action?.onClicked?.addListener(handleFirefoxActionClicked)
}

// Ensures controllers are initialized when the browser starts.
browser.runtime.onStartup.addListener(() => {
  // init the ctrls if not already initialized
  init().catch((err) => {
    captureBackgroundException(err)
    console.error(err)
  })
})

// Ensures controllers are initialized whenever the service worker restarts, the extension is updated, or is installed for the first time.
browser.runtime.onInstalled.addListener(({ reason }: any) => {
  // init the ctrls if not already initialized
  init().catch((err) => {
    captureBackgroundException(err)
    console.error(err)
  })

  // It makes Playwright tests a bit slow (waiting the get-started tab to be loaded, switching back to the tab under the tests),
  // and we prefer to skip opening it for the testing.
  if (process.env.IS_TESTING === 'true') return
  if (isProd) {
    browser.runtime.setUninstallURL('https://www.ambire.com/uninstall')
  }
  if (reason === 'install') {
    setTimeout(() => {
      const extensionURL = browser.runtime.getURL('tab.html')
      browser.tabs.create({ url: extensionURL })
    }, 500)
  }
})

// Ensures controllers are initialized if the service worker is inactive and gets reactivated when the extension popup opens.
browser.runtime.onMessage.addListener(async (message: any) => {
  // init the ctrls if not already initialized
  init().catch((err) => {
    captureBackgroundException(err)
    console.error(err)
  })

  // The extension UI periodically sends "ping" messages. Responding here wakes up
  // the service worker and keeps it alive as long as a view (popup, window, or tab) remains open.
  if (message === 'ambire-extension-ping') return 'ambire-extension-pong'

  // Every controller reports through `captureBackgroundException`, so the crash-analytics e2e
  // spec needs a way to exercise that path. Unreachable outside a testing build.
  if (
    process.env.IS_TESTING === 'true' &&
    message?.type === 'ambire-extension-test-capture-exception-background'
  ) {
    captureBackgroundException(new Error(message.errorMessage))
    return null
  }

  return null
})

try {
  browser.tabs.onRemoved.addListener(async (tabId: number) => {
    // wait for mainCtrl to be initialized before handling dapp requests
    while (!mainCtrl) await wait(200)

    // Sessions are matched by their own tabId: keys are `windowId-tabId-dappId`, so the
    // old `${tabId}-` prefix never matched and leaked sessions past tab close.
    mainCtrl.dapps.deleteDappSessionsForTab(tabId)
  })
} catch (error) {
  console.error('Failed to register browser.tabs.onRemoved.addListener', error)
}

// FIXME: Without attaching an event listener (synchronous) here, the other `navigator.hid`
// listeners that attach when the user interacts with Ledger, are not getting triggered for manifest v3.
// TODO: Found the root cause of this! Event handler of 'disconnect' event must be added on the initial
// evaluation of worker script. More info: https://developer.chrome.com/docs/extensions/mv3/service_workers/events/
// Would be tricky to replace this workaround with different logic, but it's doable.
if ('hid' in navigator) navigator.hid.addEventListener('disconnect', () => {})

// Reset the dashboard network filter when the user's computer wakes up or unlocks.
// This prevents the confusing situation where the user returns to find only one network's
// assets displayed because they had filtered before putting the computer to sleep.
try {
  browser.idle.onStateChanged.addListener((newState: chrome.idle.IdleState) => {
    if (newState !== 'active') return
    if (!mainCtrl || !mainCtrl.selectedAccount.account) {
      console.error(
        'Idle state changed to active but mainCtrl or selected account is not initialized',
        mainCtrl
      )
      return
    }
    mainCtrl.selectedAccount.setDashboardNetworkFilter(null)
  })
} catch (error) {
  console.error('Failed to register browser.idle.onStateChanged listener', error)
}
