import { isWeb } from '@common/config/env'
import { isExtension } from '@web/constants/browserapi'

type Pathname = 'index' | 'tab' | 'action-window'

type UiType = 'popup' | 'tab' | 'action-window'

const UI_TYPE: { [key: string]: Pathname } = {
  Tab: 'tab',
  Popup: 'index',
  ActionWindow: 'action-window'
}

type UiTypeCheck = {
  isTab: boolean
  isActionWindow: boolean
  isPopup: boolean
  uiType?: UiType
}

const pathToUiType = (pathname: string): UiType => {
  try {
    let uiType = pathname.replace(/^\//, '').replace('.html', '')

    if (uiType === 'index') {
      uiType = 'popup'
    }

    return uiType as UiType
  } catch (e: any) {
    console.error('Error parsing UI type from pathname:', pathname, e)

    return 'popup'
  }
}

export const getUiType = (): UiTypeCheck => {
  if (!isWeb) {
    return { isActionWindow: false, isPopup: false, isTab: false }
  }

  if (isWeb && !isExtension) {
    return { isActionWindow: false, isPopup: false, isTab: true }
  }

  const { pathname } = window.location

  const uiTypeValues = Object.entries(UI_TYPE).reduce((m, [key, value]) => {
    m[`is${key}`] = pathname === `/${value}.html`

    return m
  }, {} as UiTypeCheck)

  return {
    ...uiTypeValues,
    uiType: pathToUiType(pathname)
  }
}
