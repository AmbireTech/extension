import { useCallback, useEffect, useState } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import useController from '@common/hooks/useController'
import { hasAuthorizedOneKeyDevice } from '@common/modules/hardware-wallets/onekey/requestOneKeyDevicePermission'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { openInternalPageInTab } from '@common/utils/links/links'
import { browser } from '@web/constants/browserapi'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectCurrentUserRequest = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest
const selectRequestWindow = (state: AllControllersMappingType['RequestsController']) =>
  state.requestWindow

const useOneKey = () => {
  const [isOneKeyConnected, setIsOneKeyConnected] = useState(false)
  const { state: currentUserRequest } = useController(
    'RequestsController',
    selectCurrentUserRequest
  )
  const { state: requestWindow } = useController('RequestsController', selectRequestWindow)

  useEffect(() => {
    const usb = (navigator as Navigator & { usb?: EventTarget }).usb
    if (!usb) return

    const detectDevice = () => {
      hasAuthorizedOneKeyDevice()
        .then(setIsOneKeyConnected)
        .catch((error) => {
          console.error(error)
          captureException(error)
        })
    }

    detectDevice()
    // The browser fires these only for devices Ambire is allowed to use
    usb.addEventListener('connect', detectDevice)
    usb.addEventListener('disconnect', detectDevice)
    browser.windows.onFocusChanged.addListener(detectDevice)

    return () => {
      usb.removeEventListener('connect', detectDevice)
      usb.removeEventListener('disconnect', detectDevice)
      browser.windows.onFocusChanged.removeListener(detectDevice)
    }
  }, [])

  const requestId = currentUserRequest?.id
  const requestKind = currentUserRequest?.kind
  const createdFromWindowId = requestWindow.windowProps?.createdFromWindowId

  const openOneKeyAuthorization = useCallback(async () => {
    const requestIdParam = requestId ? `&requestId=${requestId}` : ''

    await openInternalPageInTab({
      route: `${WEB_ROUTES.oneKeyConnect}?isReauthorization=true${requestIdParam}`,
      // Don't close the request window if the current request is a sign message
      // as that would reject the message automatically.
      shouldCloseCurrentWindow: requestKind === 'calls',
      windowId: createdFromWindowId
    })
  }, [requestId, requestKind, createdFromWindowId])

  return { isOneKeyConnected, openOneKeyAuthorization }
}

export default useOneKey
