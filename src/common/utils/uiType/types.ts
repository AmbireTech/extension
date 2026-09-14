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
  isMobileApp: boolean
  uiType?: UiType
}
