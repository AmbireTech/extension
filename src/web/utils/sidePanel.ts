type ChromeSidePanelApi = {
  setPanelBehavior: (options: { openPanelOnActionClick: boolean }) => Promise<void>
  getPanelBehavior?: () => Promise<{ openPanelOnActionClick: boolean }>
  // Chrome 140+
  getLayout?: () => Promise<{ side: 'left' | 'right' }>
  open: (options: { windowId: number }) => Promise<void>
}

const getChromeSidePanelApi = (): ChromeSidePanelApi | undefined => {
  if (typeof chrome === 'undefined') return undefined

  return (chrome as typeof chrome & { sidePanel?: ChromeSidePanelApi }).sidePanel
}

/** The `chrome.storage.local` key holding the last width of the side panel, as the user sized it. */
export const SIDE_PANEL_WIDTH_STORAGE_KEY = 'sidePanelWidth'

export const isSidePanelSupported = () => !!getChromeSidePanelApi()

export const EXTENSION_OVERLAY_PORT_NAMES = ['popup', 'side-panel'] as const

export type ExtensionOverlayPortName = (typeof EXTENSION_OVERLAY_PORT_NAMES)[number]

export const isExtensionOverlayPort = (portName: string): portName is ExtensionOverlayPortName =>
  EXTENSION_OVERLAY_PORT_NAMES.includes(portName as ExtensionOverlayPortName)

export { getChromeSidePanelApi }
