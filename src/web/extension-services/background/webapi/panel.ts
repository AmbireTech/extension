import { PanelManager, UiManager } from '@ambire-common/interfaces/ui'
import { captureBackgroundException } from '@web/extension-services/background/CrashAnalytics'
import {
  DappTabTarget,
  scheduleDappTabFocusDispatch
} from '@web/extension-services/background/handlers/dispatchDappTabFocus'
import { PortMessenger } from '@web/extension-services/messengers'
import { getChromeSidePanelApi } from '@web/utils/sidePanel'

const POPUP_PATH = 'index.html'

const PANEL_PORT_NAME = 'side-panel'

/**
 * Routes the toolbar action to the Chrome side panel instead of the extension popup (or back).
 */
export const applyPanelMode = async (enabled: boolean) => {
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
 * Opens the side panel for the given window (the active window when omitted). Chrome only allows
 * this while handling a user gesture, so it must never be called on behalf of a dapp request -
 * those are handled in the panel when it is already open and in a request window otherwise.
 */
export const openPanel = async (windowId?: number) => {
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
