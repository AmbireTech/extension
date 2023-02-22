import { isWeb } from '@config/env'

const UI_TYPE = {
  // Tab: 'index',
  Popup: 'index',
  Notification: 'notification'
}

type UiTypeCheck = {
  // isTab: boolean
  isNotification: boolean
  isPopup: boolean
}

export const getUiType = (): UiTypeCheck => {
  if (!isWeb) {
    return { isNotification: false, isPopup: false }
  }

  const { pathname } = window.location
  return Object.entries(UI_TYPE).reduce((m, [key, value]) => {
    m[`is${key}`] = pathname === `/${value}.html`

    return m
  }, {} as UiTypeCheck)
}
