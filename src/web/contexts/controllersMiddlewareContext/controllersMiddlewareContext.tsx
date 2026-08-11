import { nanoid } from 'nanoid'
/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import wait from '@ambire-common/utils/wait'
import { captureMessage } from '@common/config/analytics/CrashAnalytics.web'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext/controllersMiddlewareContext'
import { ControllersMiddlewareContextReturnType } from '@common/contexts/controllersMiddlewareContext/types'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import useIsAppFocused from '@common/hooks/useIsAppFocused'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useToast from '@common/hooks/useToast'
import eventBus from '@common/services/event/eventBus'
import { Action, MethodAction } from '@common/types/actions'
import { getUiType } from '@common/utils/uiType'
import { isExtension } from '@web/constants/browserapi'
import { ROUTE_CRITICAL_CONTROLLERS } from '@web/constants/criticalControllers'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'
import { PortMessenger } from '@web/extension-services/messengers'
import useAutoLockControllerHelpers from '@web/hooks/useAutoLockControllerHelpers'
import useDappsControllerHelpers from '@web/hooks/useDappsControllerHelpers'
import useKeystoreControllerHelpers from '@web/hooks/useKeystoreControllerHelpers'
import useSelectedAccountControllerHelpers from '@web/hooks/useSelectedAccountControllerHelpers'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
let globalDispatch: ControllersMiddlewareContextReturnType['dispatch']
let pm: PortMessenger
const actionsBeforeBackgroundReady: (MethodAction | Action)[] = []
let backgroundReady: boolean = false
// Ensure we won't miss the background's initial route if it arrives before the view mounts.
// kept here for whoever mounts next. `undefined` means the background hasn't answered yet,
// `null` that it answered there is nowhere to go.
let lastReceivedInitialRoute: string | null | undefined
let controllerReady: boolean = false
let connectPort: () => Promise<void> = () => Promise.resolve()

const MAX_RETRIES = 20
// Delay before requesting the non-critical controller states so the proactively
// pushed critical states and the first paint win the initial burst.
const DEFERRED_CONTROLLER_REQUEST_DELAY = 10
// Safety-net cadence for re-requesting controller states that never arrived.
const CONTROLLER_STATE_RECONCILE_INTERVAL = 2000
const MAX_CONTROLLER_STATE_RECONCILE_ATTEMPTS = 5
// Used to ensure the app doesn't get stuck on a blank screen
const INITIAL_ROUTE_RE_ASK_INTERVAL = 500
const MAX_INITIAL_ROUTE_ASK_ATTEMPTS = 4
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
      if (method === 'initialRoute') {
        lastReceivedInitialRoute = params.route
        eventBus.emit('initialRoute', params.route)
        return
      }
      if (messageType === '> ui') {
        if (method === 'closePopup' && getUiType().isPopup) {
          closeCurrentWindow()
        } else {
          eventBus.emit(method, params, forceEmit)
          eventBus.emit('ctrlUpdate', {
            ctrlName: method,
            ctrlState: params,
            forceEmit
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
    'GET_ALL_CONTROLLER_NAMES',
    'GET_INITIAL_ROUTE'
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
  const { navigate } = useNavigation()
  const isOnRootRoute = !route.pathname || route.pathname === '/'

  // The controller names and the resolved route arrive in separate messages, in
  // either order. `namesReceivedRef` lets `onInitialRoute` know the store has been
  // initialized before it narrows the critical set (init resets that set).
  const namesRef = useRef<(keyof AllControllersMappingType)[]>([])
  const namesReceivedRef = useRef(false)
  const routeCriticalRef = useRef<(keyof AllControllersMappingType)[] | null>(null)

  const dispatch = useCallback(
    (action: MethodAction | Action) => {
      globalDispatch(action, windowId)
    },
    [windowId]
  )

  const requestInitialRoute = useCallback(() => {
    if (!backgroundReady) return false

    globalDispatch({ type: 'GET_INITIAL_ROUTE' })

    return true
  }, [])

  // Narrows the splash gate to the route's critical controllers once both the route
  // and the controller names are known. `init` resets the critical set to `[]`, so
  // this must run after it - the `namesReceivedRef` guard ensures that ordering.
  const applyCriticalControllers = useCallback(() => {
    if (!namesReceivedRef.current || routeCriticalRef.current === null) return
    if (routeCriticalRef.current.length)
      controllerStore.setCriticalControllers(routeCriticalRef.current)
  }, [controllerStore])

  // The background is authoritative for routing: it sends the route to load, and that route
  // decides both which controllers the splash waits for and where the view goes.
  const handleInitialRoute = useCallback(
    (initialRoute: string | null) => {
      // A null route (nothing to navigate to) falls back to full readiness via an empty set.
      routeCriticalRef.current = (initialRoute && ROUTE_CRITICAL_CONTROLLERS[initialRoute]) || []
      applyCriticalControllers()

      if (!initialRoute) return
      // The request window follows every route it is sent, since it exists to show whatever
      // request is current. The popup and tabs are opened by the user, sometimes straight
      // into a screen, so for them the route only says where to start.
      if (!getUiType().isRequestWindow && !isOnRootRoute) return

      // Don't navigate if already there
      if (`${route.pathname}${route.search}` === `/${initialRoute}`) return

      navigate(initialRoute, { replace: true })
    },
    [applyCriticalControllers, isOnRootRoute, route.pathname, route.search, navigate]
  )

  useEffect(() => {
    let initialRequestTimer: NodeJS.Timeout | undefined

    const requestControllerStates = (ctrlNames: (keyof AllControllersMappingType)[]) => {
      ctrlNames.forEach((ctrlName) => {
        globalDispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller: ctrlName } })
      })
    }

    const getUninitializedControllers = () =>
      controllerStore.controllersByName.filter(
        (ctrlName) => !controllerStore.initializedControllers.has(ctrlName)
      )

    const onAllControllerNames = (names: string[]) => {
      namesRef.current = names as (keyof AllControllersMappingType)[]
      controllerStore.init(namesRef.current, [])
      namesReceivedRef.current = true
      applyCriticalControllers()

      // Request every controller's state regardless of the route. The background
      // pushes the route's critical states proactively (GET_INITIAL_ROUTE), so a tick
      // later we only ask for the ones that haven't arrived yet, and deferring keeps
      // the heavy controllers from competing with the first paint.
      initialRequestTimer = setTimeout(() => {
        requestControllerStates(getUninitializedControllers())
      }, DEFERRED_CONTROLLER_REQUEST_DELAY)

      eventBus.removeEventListener('allControllerNames', onAllControllerNames)
    }

    const onReady = () => {
      globalDispatch({ type: 'GET_ALL_CONTROLLER_NAMES' })
      eventBus.removeEventListener('onReady', onReady)
    }

    // Retry requesting any controller states that never arrived.
    let reconcileAttempts = 0
    const reconcileTimer = setInterval(() => {
      if (controllerStore.isReady) {
        clearInterval(reconcileTimer)
        return
      }
      const missing = getUninitializedControllers()
      // Nothing to recover yet (names not received, or every state already arrived).
      // Keep idling - readiness that is only waiting on `isReady` flags arrives via
      // the normal update broadcasts, not by re-requesting.
      if (!missing.length) return
      requestControllerStates(missing)
      reconcileAttempts += 1
      if (reconcileAttempts >= MAX_CONTROLLER_STATE_RECONCILE_ATTEMPTS)
        clearInterval(reconcileTimer)
    }, CONTROLLER_STATE_RECONCILE_INTERVAL)

    eventBus.addEventListener('allControllerNames', onAllControllerNames)
    eventBus.addEventListener('onReady', onReady)

    if (!controllerReady) controllerReady = true

    return () => {
      eventBus.removeEventListener('allControllerNames', onAllControllerNames)
      eventBus.removeEventListener('onReady', onReady)
      if (initialRequestTimer) clearTimeout(initialRequestTimer)
      clearInterval(reconcileTimer)
    }
  }, [controllerStore, applyCriticalControllers])

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
    // Depend on the primitive location parts, not the `route` object. `useRoute`
    // returns a fresh object every render, so depending on it would re-dispatch
    // UPDATE_PORT_URL on every re-render (e.g. while the portfolio streams in),
    // not only on real navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.pathname, route.search, route.hash])

  // Get the initial route from the background
  useEffect(() => {
    eventBus.addEventListener('initialRoute', handleInitialRoute)

    return () => eventBus.removeEventListener('initialRoute', handleInitialRoute)
  }, [handleInitialRoute])

  // The route usually arrives before this view mounts, so the one remembered from then has
  // to be handled here.
  useEffect(() => {
    if (lastReceivedInitialRoute === undefined) return

    handleInitialRoute(lastReceivedInitialRoute)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Retry asking for the initial route
  useEffect(() => {
    if (!isExtension || !isOnRootRoute) return

    let attempts = 0
    let reAskTimeout: NodeJS.Timeout

    const askForRoute = () => {
      if (attempts >= MAX_INITIAL_ROUTE_ASK_ATTEMPTS) return

      if (requestInitialRoute()) attempts += 1

      reAskTimeout = setTimeout(askForRoute, INITIAL_ROUTE_RE_ASK_INTERVAL)
    }

    askForRoute()

    return () => clearTimeout(reAskTimeout)
  }, [isOnRootRoute, requestInitialRoute])

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
    if (!isFocused) return
    // use globalDispatch (not the memoized dispatch) so this fires once per focus
    // transition; dispatch's identity changes when windowId resolves, which would
    // otherwise re-run this effect and signal focus twice on popup open
    globalDispatch({ type: 'SET_VIEW_FOCUS', params: {} })
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
  useSelectedAccountControllerHelpers()

  return (
    <ControllersMiddlewareContext.Provider value={useMemo(() => ({ dispatch }), [dispatch])}>
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}
