import { isWeb } from '@common/config/env'
import { isExtension } from '@web/constants/browserapi'

type Pathname = 'index' | 'tab' | 'request-window'

type UiType = 'popup' | 'tab' | 'request-window'

const UI_TYPE: { [key: string]: Pathname } = {
  Tab: 'tab',
  Popup: 'index',
  RequestWindow: 'request-window'
}

type UiTypeCheck = {
  isTab: boolean
  isRequestWindow: boolean
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
    return { isRequestWindow: false, isPopup: false, isTab: false }
  }

  if (isWeb && !isExtension) {
    return { isRequestWindow: false, isPopup: false, isTab: true }
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
