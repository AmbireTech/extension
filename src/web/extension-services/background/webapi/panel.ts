import { PanelManager, UiManager } from '@ambire-common/interfaces/ui'
import { browser, engine } from '@web/constants/browserapi'
import { captureBackgroundException } from '@web/extension-services/background/CrashAnalytics'
import {
  DappTabTarget,
  scheduleDappTabFocusDispatch
} from '@web/extension-services/background/handlers/dispatchDappTabFocus'
import { PortMessenger } from '@web/extension-services/messengers'
import { getChromeSidePanelApi, getFirefoxSidebarApi } from '@web/utils/sidePanel'

const POPUP_PATH = 'index.html'

const PANEL_PORT_NAME = 'side-panel'

const isGecko = engine === 'gecko'

/**
 * Firefox has no `sidePanel.setPanelBehavior({ openPanelOnActionClick })` equivalent: unlike
 * Chrome, clicking the toolbar action only dispatches `onClicked` when no popup is set (see
 * applyPanelMode, which clears it when panel mode is on), so the sidebar has to be opened here.
 * Because `onClicked` only fires in panel mode, no mode check is needed - and it must not read
 * wallet state, since the click can wake a suspended background before the controllers load.
 * `open()` is called synchronously so it stays within the user gesture Firefox requires.
 *
 * This module is imported by UI code too (e.g. wallet-state.web.ts is pulled in by the Avatar
 * components), so the listener itself must be registered from background.ts - a real
 * `browser.action.onClicked.addListener` call here would run once per extension page (popup,
 * tab, request-window, side-panel) in addition to the background, since they all bundle this
 * module. Registering the same browser-chrome-level listener from a non-background page context
 * corrupts the extension's WebExtension IPC state in Firefox and hangs every subsequent
 * `browser.*` call.
 */
export const handleFirefoxActionClicked = async () => {
  try {
    await getFirefoxSidebarApi()?.open()
  } catch (error) {
    console.error('Failed to open the Firefox sidebar', error)
    captureBackgroundException(error)
  }
}

/**
 * Routes the toolbar action to the side panel instead of the extension popup (or back).
 */
export const applyPanelMode = async (enabled: boolean) => {
  if (isGecko) {
    const sidebarApi = getFirefoxSidebarApi()
    if (!sidebarApi) return

    try {
      await browser.action.setPopup({ popup: enabled ? '' : POPUP_PATH })
    } catch (error) {
      console.error('Failed to apply side panel mode', error)
      captureBackgroundException(error)
    }

    return
  }

  const sidePanelApi = getChromeSidePanelApi()
  if (!sidePanelApi) return

  try {
    await sidePanelApi.setPanelBehavior({ openPanelOnActionClick: enabled })
    await chrome.action.setPopup({ popup: enabled ? '' : POPUP_PATH })
  } catch (error) {
    console.error('Failed to apply side panel mode', error)
    captureBackgroundException(error)
  }
}

/**
 * Whether the toolbar action opens the side panel instead of the popup. Read from the browser
 * instead of the wallet state, so the mode is available without plumbing a controller around.
 * (Firefox has no `getPanelBehavior`, so there an empty action popup - set by applyPanelMode -
 * is what signals panel mode.)
 */
export const isSidePanelModeEnabled = async () => {
  if (isGecko) {
    try {
      const popup = await browser.action.getPopup({})

      return popup === ''
    } catch (error) {
      console.error('Failed to read the side panel mode', error)
      captureBackgroundException(error)

      return false
    }
  }

  const sidePanelApi = getChromeSidePanelApi()
  if (!sidePanelApi?.getPanelBehavior) return false

  try {
    const behavior = await sidePanelApi.getPanelBehavior()

    return !!behavior?.openPanelOnActionClick
  } catch (error) {
    console.error('Failed to read the side panel mode', error)
    captureBackgroundException(error)

    return false
  }
}

/**
 * Opens the side panel for the given window (the active window when omitted; Firefox's
 * sidebarAction API always targets the current window and takes no windowId). Chrome and Firefox
 * both only allow this while handling a user gesture, so it must never be called on behalf of a
 * dapp request - those are handled in the panel when it is already open and in a request window
 * otherwise.
 */
export const openPanel = async (windowId?: number) => {
  if (isGecko) {
    const sidebarApi = getFirefoxSidebarApi()
    if (!sidebarApi) return

    try {
      await sidebarApi.open()
    } catch (error) {
      console.error('Failed to open side panel', error)
      captureBackgroundException(error)
    }

    return
  }

  const sidePanelApi = getChromeSidePanelApi()
  if (!sidePanelApi) return

  try {
    let resolvedWindowId = windowId

    if (!resolvedWindowId) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      resolvedWindowId = activeTab?.windowId
    }

    if (!resolvedWindowId) return

    await sidePanelApi.open({ windowId: resolvedWindowId })
  } catch (error) {
    console.error('Failed to open side panel', error)
    captureBackgroundException(error)
  }
}

/**
 * The panel part of the UI manager. A connected side-panel port is the only reliable signal that
 * the panel is showing, since Chrome exposes no way to query its state. The panel is deliberately
 * not openable or closable from here - the user owns its lifecycle - so requests fall back to a
 * request window whenever it isn't open.
 */
const isPanelOpen = (pm: PortMessenger) => pm.ports.some((port) => port.name === PANEL_PORT_NAME)

export const getPanelManager = (pm: PortMessenger): PanelManager => ({
  isOpen: () => isPanelOpen(pm)
})

/**
 * The dapp's tab keeps the browser focus while the panel handles a request, so dapp libraries
 * (e.g. React Query) never see a focus event and don't refetch the wallet state they cache. A
 * request window doesn't need this - the tab regains focus on its own once the window closes.
 */
export const getDappTabFocusDispatcher =
  (pm: PortMessenger): NonNullable<UiManager['dispatchDappTabFocus']> =>
  (targets: DappTabTarget[]) => {
    if (!isPanelOpen(pm)) return

    scheduleDappTabFocusDispatch(targets)
  }
