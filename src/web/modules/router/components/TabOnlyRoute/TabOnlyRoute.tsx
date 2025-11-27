import React, { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import useRoute from '@common/hooks/useRoute'
import { isExtension } from '@web/constants/browserapi'
import { openInternalPageInTab } from '@web/extension-services/background/webapi/tab'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import { getUiType } from '@web/utils/uiType'

const { isTab } = getUiType()

const TabOnlyRoute = () => {
  const isActionWindow = getUiType().isActionWindow
  const { path, search, params } = useRoute()
  const { currentUserRequest, requestWindow } = useRequestsControllerState()

  // if the current window is request-window and there is a action request don't open
  // the route in tab because the dApp that requests the action request
  // will loose the session with the wallet and the action request response won't arrive

  useEffect(() => {
    if (!isTab && isExtension) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      openInternalPageInTab({
        route: `${path?.substring(1)}${search}`,
        searchParams: params,
        shouldCloseCurrentWindow: true,
        windowId: requestWindow.windowProps?.createdFromWindowId
      })
    }
  }, [path, search, params, requestWindow.windowProps?.createdFromWindowId])

  if (isActionWindow && currentUserRequest) {
    return <Outlet />
  }

  if (!isTab && isExtension) {
    /* eslint-disable react/jsx-no-useless-fragment */
    return <></>
  }

  return <Outlet />
}

export default TabOnlyRoute
