import { browser, engine } from '@web/constants/browserapi'

type ChromeSidePanelApi = {
  setPanelBehavior: (options: { openPanelOnActionClick: boolean }) => Promise<void>
  getPanelBehavior?: () => Promise<{ openPanelOnActionClick: boolean }>
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

// Firefox has no Chromium-style `sidePanel` API - the sidebar is controlled via the
// Firefox-only `sidebarAction` API instead, which has a different shape (see webapi/panel.ts).
const getFirefoxSidebarApi = (): FirefoxSidebarApi | undefined => {
  if (engine !== 'gecko') return undefined

  return browser?.sidebarAction
}

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
