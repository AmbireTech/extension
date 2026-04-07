import { nanoid } from 'nanoid'
/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import wait from '@ambire-common/utils/wait'
import { captureMessage } from '@common/config/analytics/CrashAnalytics.web'
import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext/controllersMiddlewareContext'
import { ControllersMiddlewareContextReturnType } from '@common/contexts/controllersMiddlewareContext/types'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import useIsAppFocused from '@common/hooks/useIsAppFocused'
import useRoute from '@common/hooks/useRoute'
import useToast from '@common/hooks/useToast'
import eventBus from '@common/services/event/eventBus'
import { Action, MethodAction } from '@common/types/actions'
import { getUiType } from '@common/utils/uiType'
import { isExtension } from '@web/constants/browserapi'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import { PortMessenger } from '@web/extension-services/messengers'
import useAutoLockControllerHelpers from '@web/hooks/useAutoLockControllerHelpers'
import useDappsControllerHelpers from '@web/hooks/useDappsControllerHelpers'
import useKeystoreControllerHelpers from '@web/hooks/useKeystoreControllerHelpers'
import useRequestsControllerHelpers from '@web/hooks/useRequestsControllerHelpers'
import useSelectedAccountControllerHelpers from '@web/hooks/useSelectedAccountControllerHelpers'

let globalDispatch: ControllersMiddlewareContextReturnType['dispatch']
let pm: PortMessenger
const actionsBeforeBackgroundReady: (MethodAction | Action)[] = []
let backgroundReady: boolean = false
let controllerReady: boolean = false
let connectPort: () => Promise<void> = () => Promise.resolve()

const MAX_RETRIES = 20
// Facilitate communication between the different parts of the browser extension.
// Utilizes the PortMessenger class to establish a connection between the popup
// and background pages, and the eventBus to emit and listen for events.
// This allows the browser extension's UI to send and receive messages to and
// from the background process (needed for updating the browser extension UI
// based on the state of the background process and for sending dApps-initiated
// actions to the background for further processing.
if (isExtension) {
  const portId = nanoid()
  let retries = 0
  connectPort = async () => {
    pm = new PortMessenger()
    backgroundReady = false

    let portName = 'popup'
    if (getUiType().isTab) portName = 'tab'
    if (getUiType().isRequestWindow) portName = 'request-window'

    pm.connect({ id: portId, name: portName })
    // connect to the portMessenger initialized in the background
    // @ts-ignore
    pm.addConnectListener(pm.ports[0].id, (messageType, { method, params, forceEmit }) => {
      if (method === 'portReady' && !backgroundReady) {
        backgroundReady = true
        ;(async () => {
          while (!controllerReady) {
            eventBus.emit('onReady')
            await wait(100)
          }
          eventBus.emit('onReady')
        })()
        actionsBeforeBackgroundReady.forEach((a) => globalDispatch(a))
        actionsBeforeBackgroundReady.length = 0
        return
      }
      if (method === 'allControllerNames') {
        eventBus.emit('allControllerNames', params.names)
        return
      }
      if (messageType === '> ui') {
        if (method === 'closePopup' && getUiType().isPopup) {
          closeCurrentWindow()
        } else {
          eventBus.emit(method, params, forceEmit)
          eventBus.emit('ctrlUpdate', {
            ctrlName: method,
            ctrlState: params
          })
        }
      }
      if (messageType === '> ui-error') {
        eventBus.emit('error', params)
      }
      if (messageType === '> ui-toast') {
        eventBus.emit(method, params)
      }
    })
    ;(async () => {
      try {
        while (!backgroundReady) {
          pm.send('> background', { type: 'HANDSHAKE' })
          await wait(250)
        }
      } catch (e) {
        console.error(e)
      }
    })()

    // Use at least 1000ms; on slower PCs, background responses can be slightly delayed,
    // causing multiple recursive connectPort calls and slowing down window initialization.
    // Once MAX_RETRIES is reached, it will stop retrying and wait indefinitely for the background to send 'portReady'
    // because if the 'portReady' res from the background is delayed more than 1000ms the connection will never resolve calling the recursion forever
    setTimeout(() => {
      if (!backgroundReady && retries === MAX_RETRIES) {
        captureMessage(
          `Error: Failed to connect with the service worker after maximum retries. Window type: ${portName}`,
          { level: 'fatal' }
        )
      }

      if (!backgroundReady && retries < MAX_RETRIES) {
        retries++
        connectPort()
      }
    }, 1000)
  }

  connectPort()
}

if (isExtension) {
  const ACTION_TYPES_TO_DISPATCH_EVEN_WHEN_HIDDEN = [
    'INIT_CONTROLLER_STATE',
    'GET_ALL_CONTROLLER_NAMES'
  ]

  const ACTION_METHODS_TO_DISPATCH_EVEN_WHEN_HIDDEN = [
    'filterAccountsOps',
    'filterSignedMessages',
    'resetAccountsOpsFilters',
    'resetSignedMessagesFilters'
  ]

  globalDispatch = (action, windowId?: number) => {
    // Dispatch the action only when the tab or popup is focused or active.
    // Otherwise, multiple dispatches could occur if the same screen is open in multiple tabs/popup windows,
    // causing unpredictable background/controllers state behavior.
    // dispatches from request-window should not be blocked even when unfocused
    // because we can have only one instance of request-window and only one instance for the given action screen
    // (an action screen could not be opened in tab or popup window by design)
    const shouldBlockDispatch = document.hidden && !getUiType().isRequestWindow
    if (
      shouldBlockDispatch &&
      !ACTION_TYPES_TO_DISPATCH_EVEN_WHEN_HIDDEN.includes(action.type) &&
      !ACTION_METHODS_TO_DISPATCH_EVEN_WHEN_HIDDEN.includes((action as any).params?.method)
    )
      return

    if (!backgroundReady) {
      actionsBeforeBackgroundReady.push(action)
    } else {
      pm.send('> background', action, { windowId })
    }
  }
}

export const ControllersMiddlewareProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { addToast } = useToast()
  const route = useRoute()
  const timer = useRef<NodeJS.Timeout>(null)
  const isFocused = useIsAppFocused()
  const [windowId, setWindowId] = useState<number | undefined>()
  const hasConnectedToTheBackground = useRef(false)
  const { controllerStore } = useContext(ControllerStoreContext)

  const dispatch = useCallback(
    (action: MethodAction | Action) => {
      globalDispatch(action, windowId)
    },
    [windowId]
  )

  useEffect(() => {
    const onAllControllerNames = (names: string[]) => {
      controllerStore.init(
        names as (keyof AllControllersMappingType)[],
        (allCtrls: (keyof AllControllersMappingType)[]) => {
          allCtrls.forEach((ctrlName) => {
            dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller: ctrlName } })
          })
        }
      )
      eventBus.removeEventListener('allControllerNames', onAllControllerNames)
    }

    const onReady = () => {
      dispatch({ type: 'GET_ALL_CONTROLLER_NAMES' })
      eventBus.removeEventListener('onReady', onReady)
    }

    eventBus.addEventListener('allControllerNames', onAllControllerNames)
    eventBus.addEventListener('onReady', onReady)
    if (!controllerReady) controllerReady = true

    return () => {
      eventBus.removeEventListener('allControllerNames', onAllControllerNames)
      eventBus.removeEventListener('onReady', onReady)
    }
  }, [controllerStore, dispatch])

  useEffect(() => {
    if (!isExtension) return
    ;(async () => {
      if (getUiType().isPopup) {
        const win = await chrome.windows.getCurrent()
        setWindowId(win.id)
      } else if (getUiType().isTab) {
        const tab = await chrome.tabs.getCurrent()
        if (tab) setWindowId(tab.windowId)
      }
    })()
  }, [])

  useEffect(() => {
    const { pathname = '/', search = '', hash = '' } = route

    const url = `${window.location.origin}${pathname}${search}${hash}`

    const searchParams = new URLSearchParams(search)
    const searchParamsFormatted = Object.fromEntries(searchParams.entries())

    globalDispatch({
      type: 'UPDATE_PORT_URL',
      params: {
        url,
        route: pathname.startsWith('/') ? pathname.slice(1) : pathname,
        searchParams: searchParamsFormatted
      }
    })
  }, [route])

  useEffect(() => {
    if (!isExtension) return

    const keepAlive = async () => {
      try {
        const res = await chrome.runtime.sendMessage('ambire-extension-ping')
        if (res === 'ambire-extension-pong') hasConnectedToTheBackground.current = true
      } catch (error) {
        console.error(error)
      }
      timer.current = setTimeout(keepAlive, 2500)
    }

    if (isFocused) {
      keepAlive()
    } else if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [isFocused])

  useEffect(() => {
    if (!isExtension) return

    try {
      chrome.runtime.onMessage.addListener(async (message: any) => {
        if (!hasConnectedToTheBackground.current) return

        if (message.action === 'sw-started') {
          // if the sw restarts and the current window is an action window then close it
          // because the actions state has been lost after the sw restart
          if (getUiType().isRequestWindow) {
            closeCurrentWindow()
          } else {
            sessionStorage.setItem('backgroundState', 'restarted')
            window.location.reload()
          }
        }
      })
    } catch (error) {
      console.error(error)
    }
  }, [])

  useEffect(() => {
    if (!isExtension) return

    const backgroundState = sessionStorage.getItem('backgroundState')

    if (backgroundState === 'restarted') {
      addToast(
        'Page was restarted because the browser put Ambire to sleep. Any transactions or operations you have started have been cleared.',
        { type: 'info', sticky: true }
      )
      sessionStorage.removeItem('backgroundState')
    }
  }, [addToast])

  useDappsControllerHelpers(dispatch)
  useAutoLockControllerHelpers(dispatch)
  useKeystoreControllerHelpers()
  useRequestsControllerHelpers()
  useSelectedAccountControllerHelpers()

  return (
    <ControllersMiddlewareContext.Provider value={useMemo(() => ({ dispatch }), [dispatch])}>
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}
