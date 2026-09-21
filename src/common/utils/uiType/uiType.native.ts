import { UiTypeCheck } from './types'

// There is one ui type on the mobile app, so this is a constant rather than an object
// built per call - and it is called from render bodies and animation callbacks.
const MOBILE_APP_UI_TYPE: UiTypeCheck = {
  isRequestWindow: false,
  isPopup: false,
  isSidePanel: false,
  isTab: false,
  isMobileApp: true,
  uiType: 'mobile-app'
}

export const getUiType = (): UiTypeCheck => MOBILE_APP_UI_TYPE
