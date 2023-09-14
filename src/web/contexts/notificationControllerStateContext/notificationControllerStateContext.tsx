/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect, useMemo, useState } from 'react'

import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import {
  NotificationController,
  SIGN_METHODS
} from '@web/extension-services/background/controllers/notification'
import eventBus from '@web/extension-services/event/eventBus'
import useBackgroundService from '@web/hooks/useBackgroundService'
import { getUiType } from '@web/utils/uiType'

const NotificationControllerStateContext = createContext<NotificationController>(
  {} as NotificationController
)

const NotificationControllerStateProvider: React.FC<any> = ({ children }) => {
  const [state, setState] = useState({} as NotificationController)
  const { dispatch } = useBackgroundService()
  const prevState = usePrevious(state) || ({} as NotificationController)

  const { navigate } = useNavigation()

  useEffect(() => {
    dispatch({
      type: 'INIT_CONTROLLER_STATE',
      params: { controller: 'notification' }
    })
  }, [dispatch])

  useEffect(() => {
    const onUpdate = (newState: NotificationController) => {
      setState(newState)
    }

    eventBus.addEventListener('notification', onUpdate)

    return () => eventBus.removeEventListener('notification', onUpdate)
  }, [])

  // after a change in the notification request navigate to SortHat to manage the next screen
  // based on the notification type or if notif request is null to open some of the other internal screens of the wallet
  useEffect(() => {
    const id = state.currentNotificationRequest?.id
    const prevId = prevState?.currentNotificationRequest?.id
    if (prevId !== id) {
      setTimeout(() => navigate('/'))
    }
  }, [prevState.currentNotificationRequest?.id, state.currentNotificationRequest?.id, navigate])

  // if current window type is popup or tab and
  // there is an unfocused notification window
  // reopen it and close the current window
  // this behavior will happen until the request in the notification window is resolved/rejected
  useEffect(() => {
    const isNotification = getUiType().isNotification
    if (
      !isNotification &&
      state.notificationWindowId &&
      state.currentNotificationRequest &&
      !SIGN_METHODS.includes(state.currentNotificationRequest?.params?.method)
    ) {
      dispatch({
        type: 'NOTIFICATION_CONTROLLER_REOPEN_CURRENT_NOTIFICATION_REQUEST'
      })
      window.close()
    }
  }, [
    dispatch,
    state.currentNotificationRequest?.params.method,
    state.notificationWindowId,
    state.currentNotificationRequest
  ])

  return (
    <NotificationControllerStateContext.Provider value={useMemo(() => state, [state])}>
      {children}
    </NotificationControllerStateContext.Provider>
  )
}

export { NotificationControllerStateProvider, NotificationControllerStateContext }
