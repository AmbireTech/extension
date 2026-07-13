import { isWeb } from '@common/config/env'
import { isExtension } from '@web/constants/browserapi'

import { UI_TYPE, UiType, UiTypeCheck } from './types'

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
    return { isRequestWindow: false, isPopup: false, isTab: false, isMobileApp: false }
  }

  if (isWeb && !isExtension) {
    return { isRequestWindow: false, isPopup: false, isTab: true, isMobileApp: false }
  }

  const { pathname } = window.location

  const uiTypeValues = Object.entries(UI_TYPE).reduce(
    (m, [key, value]) => {
      m[`is${key}`] = pathname === `/${value}.html`

      return m
    },
    {} as Record<string, any>
  ) as UiTypeCheck

  return {
    ...uiTypeValues,
    uiType: pathToUiType(pathname),
    isMobileApp: false
  }
}
