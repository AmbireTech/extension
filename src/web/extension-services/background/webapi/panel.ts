import { PanelManager, UiManager } from '@ambire-common/interfaces/ui'
import { browser, engine } from '@web/constants/browserapi'
import { captureBackgroundException } from '@web/extension-services/background/CrashAnalytics'
import {
  DappTabTarget,
  scheduleDappTabFocusDispatch
} from '@web/extension-services/background/handlers/dispatchDappTabFocus'
import { PortMessenger } from '@web/extension-services/messengers'
import {
  FIREFOX_SIDEBAR_IS_ON_LEFT_STORAGE_KEY,
  getChromeSidePanelApi,
  getFirefoxSidebarApi
} from '@web/utils/sidePanel'

const POPUP_PATH = 'index.html'

const PANEL_PORT_NAME = 'side-panel'

const isGecko = engine === 'gecko'

/**
 * Opens or closes the Firefox sidebar on a toolbar click (Firefox has no `openPanelOnActionClick`).
 * `onClicked` only fires when no popup is set, which applyPanelMode ensures in panel mode, so no
 * mode check is needed - nor wallet state read, as the click can wake the background before the
 * controllers load. `toggle()` runs before any await, within the user gesture Firefox requires.
 * Registered from background.ts only (see there).
 */
export const handleFirefoxActionClicked = async () => {
  try {
    await getFirefoxSidebarApi()?.toggle()
  } catch (error) {
    console.error('Failed to toggle the Firefox sidebar', error)
    captureBackgroundException(error)
  }
}

/**
 * Routes the toolbar action to the side panel instead of the extension popup (or back).
 * On Chrome the side panel is also disabled while the mode is off, which removes the wallet from
 * Chrome's own side panel menu and closes a panel that is open - otherwise the wallet could still
 * be opened there, and dapp requests would be routed to it instead of a request window.
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
    // Enabled before the toolbar action starts opening it, so a click in between doesn't land on
    // a disabled panel
    await sidePanelApi.setOptions?.({ enabled })
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
 * Whether the user placed the side panel on the left of the browser window. Chrome versions
 * that can't report the side only support the default right side. Firefox can't report it at all,
 * so there the side the sidebar last measured itself on is used, or Firefox's default left side.
 */
export const isSidePanelOnLeft = async () => {
  if (isGecko) {
    try {
      const { [FIREFOX_SIDEBAR_IS_ON_LEFT_STORAGE_KEY]: isOnLeft } =
        await browser.storage.local.get(FIREFOX_SIDEBAR_IS_ON_LEFT_STORAGE_KEY)

      return typeof isOnLeft === 'boolean' ? isOnLeft : true
    } catch (error) {
      console.error('Failed to read the Firefox sidebar side', error)
      captureBackgroundException(error)

      return true
    }
  }

  const sidePanelApi = getChromeSidePanelApi()
  if (!sidePanelApi?.getLayout) return false

  try {
    const layout = await sidePanelApi.getLayout()

    return layout?.side === 'left'
  } catch (error) {
    console.error('Failed to read the side panel side', error)
    captureBackgroundException(error)

    return false
  }
}

/**
 * Opens the Chrome side panel for the given window (the active window when omitted). Chrome only
 * allows this while handling a user gesture, so it must never be called on behalf of a dapp
 * request - those are handled in the panel when it is already open and in a request window
 * otherwise. Firefox's sidebar isn't opened from here: the gesture doesn't survive a message to
 * the background, so it's opened by the UI (openFirefoxSidebarFromUserGesture) and toggled by the
 * toolbar action (handleFirefoxActionClicked).
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

// The browser window each connected panel is in, reported by the panel itself, because a panel's
// port carries no tab and so no window. Entries are removed when the panel's port disconnects.
const panelWindowIdByPortId = new Map<string, number>()

/** Records the browser window a side panel is in (see SET_SIDE_PANEL_WINDOW_ID). */
export const setPanelWindowId = (portId: string, windowId: number) => {
  panelWindowIdByPortId.set(portId, windowId)
}

/** The browser window a side panel is in, or undefined until the panel has reported it. */
export const getPanelWindowId = (portId: string) => panelWindowIdByPortId.get(portId)

/** Forgets the window of a side panel whose port disconnected. */
export const forgetPanelWindowId = (portId: string) => {
  panelWindowIdByPortId.delete(portId)
}

/**
 * Whether a side panel can show requests: a side-panel port is connected (Chrome can't be asked)
 * and panel mode is on - with the mode off, Firefox's sidebar shows the "mode off" notice and
 * Chrome's panel is closing. With a `windowId`, only a panel that has reported that window counts.
 */
const isPanelOpen = (
  pm: PortMessenger,
  getIsPanelModeEnabled: () => boolean,
  windowId?: number
) => {
  const panelPorts = pm.ports.filter((port) => port.name === PANEL_PORT_NAME)
  if (!panelPorts.length) return false
  if (!getIsPanelModeEnabled()) return false
  if (windowId === undefined) return true

  return panelPorts.some((port) => panelWindowIdByPortId.get(port.id) === windowId)
}

export const getPanelManager = (
  pm: PortMessenger,
  getIsPanelModeEnabled: () => boolean
): PanelManager => ({
  isOpen: (windowId?: number) => isPanelOpen(pm, getIsPanelModeEnabled, windowId)
})

/**
 * The dapp's tab keeps the browser focus while the panel handles a request, so dapp libraries
 * (e.g. React Query) never see a focus event and don't refetch the wallet state they cache. A
 * request window doesn't need this - the tab regains focus on its own once the window closes.
 */
export const getDappTabFocusDispatcher =
  (
    pm: PortMessenger,
    getIsPanelModeEnabled: () => boolean
  ): NonNullable<UiManager['dispatchDappTabFocus']> =>
  (targets: DappTabTarget[]) => {
    if (!targets.some(({ windowId }) => isPanelOpen(pm, getIsPanelModeEnabled, windowId))) return

    scheduleDappTabFocusDispatch(targets)
  }
