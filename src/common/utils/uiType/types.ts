export type Pathname = 'index' | 'tab' | 'request-window' | 'side-panel' | 'mobile-app'

export type UiType = 'popup' | 'tab' | 'request-window' | 'side-panel' | 'mobile-app'

export const UI_TYPE: { [key: string]: Pathname } = {
  Tab: 'tab',
  Popup: 'index',
  RequestWindow: 'request-window',
  SidePanel: 'side-panel',
  MobileApp: 'mobile-app'
}

export type UiTypeCheck = {
  isTab: boolean
  isRequestWindow: boolean
  isPopup: boolean
  isSidePanel: boolean
  /**
   * The side panel is Firefox's sidebar. Unlike Chrome's side panel, it can be open while side
   * panel mode is off (it then shows a "mode off" notice instead of the wallet), it can be dragged
   * narrower than the layout supports, and it can't report its own side or width.
   */
  isFirefoxSidebar: boolean
  isMobileApp: boolean
  uiType?: UiType
}
