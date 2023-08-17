import { ErrorRef } from 'ambire-common/src/controllers/eventEmitter'
import React, { createContext, useEffect, useMemo } from 'react'

import { isExtension } from '@web/constants/browserapi'
import {
  backgroundServiceContextDefaults,
  BackgroundServiceContextReturnType
} from '@web/contexts/backgroundServiceContext/types'
import eventBus from '@web/extension-services/event/eventBus'
import PortMessage from '@web/extension-services/message/portMessage'
import { getUiType } from '@web/utils/uiType'

let dispatch: BackgroundServiceContextReturnType['dispatch']
let dispatchAsync: BackgroundServiceContextReturnType['dispatchAsync']

// Facilitate communication between the different parts of the browser extension.
// Utilizes the PortMessage class to establish a connection between the popup
// and background pages, and the eventBus to emit and listen for events.
// This allows the browser extension's UI to send and receive messages to and
// from the background process (needed for updating the browser extension UI
// based on the state of the background process and for sending dApps-initiated
// actions to the background for further processing.
if (isExtension) {
  const portMessageChannel = new PortMessage()

  const isTab = getUiType().isTab
  const isNotification = getUiType().isNotification

  let portName = 'popup'

  if (isTab) portName = 'tab'
  if (isNotification) portName = 'notification'

  portMessageChannel.connect(portName)

  portMessageChannel.listen((data: { type: string; method: string; params: any }) => {
    if (data.type === 'broadcast') {
      eventBus.emit(data.method, data.params)
    }
    if (data.type === 'broadcast-error') {
      eventBus.emit('error', data.params)
    }
  })

  eventBus.addEventListener('broadcastToBackground', (data) => {
    portMessageChannel.request({
      type: 'broadcast',
      method: data.method,
      params: data.data
    })
  })

  dispatch = (action) => {
    return portMessageChannel.request({
      type: action.type,
      // TypeScript being unable to guarantee that every member of the Action
      // union has the `params` property (some indeed don't), but this is fine.
      // @ts-ignore
      params: action.params
    })
  }

  dispatchAsync = dispatch
}

const BackgroundServiceContext = createContext<BackgroundServiceContextReturnType>(
  backgroundServiceContextDefaults
)

const BackgroundServiceProvider: React.FC<any> = ({ children }) => {
  useEffect(() => {
    const onUpdate = (newState: { errors: ErrorRef[]; controller: string }) => {
      const lastError = newState.errors[newState.errors.length - 1]

      if (lastError) {
        // TODO: display error toast instead
        // eslint-disable-next-line no-alert
        alert(lastError.message)
        console.error(
          `Error in ${newState.controller} controller. Inspect background page to see the full stack trace.`
        )
      }
    }

    eventBus.addEventListener('error', onUpdate)

    return () => eventBus.removeEventListener('error', onUpdate)
  }, [])

  return (
    <BackgroundServiceContext.Provider value={useMemo(() => ({ dispatch, dispatchAsync }), [])}>
      {children}
    </BackgroundServiceContext.Provider>
  )
}

export { BackgroundServiceProvider, BackgroundServiceContext }
