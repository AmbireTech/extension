import { useCallback } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import { hasAuthorizedOneKeyDevice } from '@common/modules/hardware-wallets/onekey/requestOneKeyDevicePermission'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { openInternalPageInTab } from '@common/utils/links/links'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectCurrentUserRequest = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest
const selectRequestWindow = (state: AllControllersMappingType['RequestsController']) =>
  state.requestWindow

const useOneKey = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { state: currentUserRequest } = useController(
    'RequestsController',
    selectCurrentUserRequest
  )
  const { state: requestWindow } = useController('RequestsController', selectRequestWindow)

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

  // Checked on every sign rather than kept in state, so a check that hasn't finished yet,
  // or a device unplugged since the last one, can't decide whether the authorization opens
  const ensureOneKeyAccess = useCallback(async () => {
    try {
      if (await hasAuthorizedOneKeyDevice()) return true

      await openOneKeyAuthorization()
    } catch (error: any) {
      console.error(error)
      captureException(error)
      addToast(t("Ambire couldn't reach your OneKey. Reconnect it and try again."), {
        type: 'error'
      })
    }

    return false
  }, [openOneKeyAuthorization, addToast, t])

  return { ensureOneKeyAccess }
}

export default useOneKey
