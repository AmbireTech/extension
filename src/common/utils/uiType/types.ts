export type Pathname = 'index' | 'tab' | 'request-window' | 'mobile-app'

export type UiType = 'popup' | 'tab' | 'request-window' | 'mobile-app'

export const UI_TYPE: { [key: string]: Pathname } = {
  Tab: 'tab',
  Popup: 'index',
  RequestWindow: 'request-window',
  MobileApp: 'mobile-app'
}

export type UiTypeCheck = {
  isTab: boolean
  isRequestWindow: boolean
  isPopup: boolean
  isMobileApp: boolean
  uiType?: UiType
}
