import { UiTypeCheck } from './types'

export const getUiType = (): UiTypeCheck => {
  return {
    isRequestWindow: false,
    isPopup: false,
    isSidePanel: false,
    isTab: false,
    isMobileApp: true,
    uiType: 'mobile-app'
  }
}
