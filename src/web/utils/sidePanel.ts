import { getUiType } from '@common/utils/uiType'
import { browser, engine } from '@web/constants/browserapi'

type ChromeSidePanelApi = {
  setPanelBehavior: (options: { openPanelOnActionClick: boolean }) => Promise<void>
  getPanelBehavior?: () => Promise<{ openPanelOnActionClick: boolean }>
  // Chrome 140+
  getLayout?: () => Promise<{ side: 'left' | 'right' }>
  open: (options: { windowId: number }) => Promise<void>
  // Optional because not every Chromium browser that exposes `sidePanel` implements it
  setOptions?: (options: { enabled?: boolean; path?: string; tabId?: number }) => Promise<void>
}

const getChromeSidePanelApi = (): ChromeSidePanelApi | undefined => {
  if (typeof chrome === 'undefined') return undefined

  return (chrome as typeof chrome & { sidePanel?: ChromeSidePanelApi }).sidePanel
}

type FirefoxSidebarApi = {
  open: () => Promise<void>
  close: () => Promise<void>
  toggle: () => Promise<void>
}

/**
 * Firefox has no Chromium-style `sidePanel` API - the sidebar is controlled via the
 * Firefox-only `sidebarAction` API instead, which has a different shape (see webapi/panel.ts).
 * Undefined outside Firefox.
 */
const getFirefoxSidebarApi = (): FirefoxSidebarApi | undefined => {
  if (engine !== 'gecko') return undefined

  return browser?.sidebarAction
}

/** Whether this view is the Firefox sidebar (see `isFirefoxSidebar` in getUiType). */
export const { isFirefoxSidebar } = getUiType()

/** Where the page's content starts on screen. Firefox-only, so undefined elsewhere. */
export const getPageScreenX = () =>
  (window as Window & { mozInnerScreenX?: number }).mozInnerScreenX

/**
 * Whether the Firefox sidebar is on the left of the browser window, measured from where its page
 * sits on screen compared to the browser window's bounds. Undefined outside Firefox or when it
 * can't be measured.
 */
export const getIsFirefoxSidebarOnLeft = async (): Promise<boolean | undefined> => {
  if (!isFirefoxSidebar) return undefined

  const pageScreenX = getPageScreenX()
  if (typeof pageScreenX !== 'number') return undefined

  const browserWindow = await browser.windows.getCurrent()
  if (typeof browserWindow?.left !== 'number' || !browserWindow.width) return undefined

  const pageCenterX = pageScreenX + window.innerWidth / 2

  return pageCenterX < browserWindow.left + browserWindow.width / 2
}

/** The `chrome.storage.local` key holding the last width of the side panel, as the user sized it. */
export const SIDE_PANEL_WIDTH_STORAGE_KEY = 'sidePanelWidth'

/**
 * The `chrome.storage.local` key holding whether the Firefox sidebar was last seen on the left of
 * the browser window. Firefox has no API that reports the side, so the sidebar measures and
 * stores it itself.
 */
export const FIREFOX_SIDEBAR_IS_ON_LEFT_STORAGE_KEY = 'isFirefoxSidebarOnLeft'

export const isSidePanelSupported = () => !!getChromeSidePanelApi() || !!getFirefoxSidebarApi()

/**
 * Opens the Firefox sidebar from an extension page. Firefox only allows `sidebarAction.open()`
 * synchronously inside a user input handler, and that gesture doesn't carry over a message to the
 * background - so this must be called from the UI, directly in the click handler, before any await.
 * No-op outside Firefox.
 */
export const openFirefoxSidebarFromUserGesture = async () => {
  await getFirefoxSidebarApi()?.open()
}

export const EXTENSION_OVERLAY_PORT_NAMES = ['popup', 'side-panel'] as const

export type ExtensionOverlayPortName = (typeof EXTENSION_OVERLAY_PORT_NAMES)[number]

export const isExtensionOverlayPort = (portName: string): portName is ExtensionOverlayPortName =>
  EXTENSION_OVERLAY_PORT_NAMES.includes(portName as ExtensionOverlayPortName)

export { getChromeSidePanelApi, getFirefoxSidebarApi }
