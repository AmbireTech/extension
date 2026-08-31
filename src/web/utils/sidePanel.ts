type ChromeSidePanelApi = {
  setPanelBehavior: (options: { openPanelOnActionClick: boolean }) => Promise<void>
  open: (options: { windowId: number }) => Promise<void>
}

const getChromeSidePanelApi = (): ChromeSidePanelApi | undefined => {
  if (typeof chrome === 'undefined') return undefined

  return (chrome as typeof chrome & { sidePanel?: ChromeSidePanelApi }).sidePanel
}

export const isSidePanelSupported = () => !!getChromeSidePanelApi()

export const EXTENSION_OVERLAY_PORT_NAMES = ['popup', 'side-panel'] as const

export type ExtensionOverlayPortName = (typeof EXTENSION_OVERLAY_PORT_NAMES)[number]

export const isExtensionOverlayPort = (portName: string): portName is ExtensionOverlayPortName =>
  EXTENSION_OVERLAY_PORT_NAMES.includes(portName as ExtensionOverlayPortName)

export { getChromeSidePanelApi }
