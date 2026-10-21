import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import useRouterHistory from '@common/hooks/useRouterHistory'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import {
  BACK_NAVIGATION_STATE,
  FORWARD_NAVIGATION_STATE,
  MOBILE_ROUTES,
  ONBOARDING_WEB_ROUTES,
  WEB_ROUTES
} from '@common/modules/router/constants/common'
import { goBackInStack } from '@common/services/navigation/stackBackNavigation'
import { syncSessionStorage } from '@common/services/storage'
import { getUiType } from '@common/utils/uiType'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

export type OnboardingRoute = (typeof ONBOARDING_WEB_ROUTES)[number]

const OnboardingNavigationContext = createContext<{
  isOnboardingRoute: boolean
  goToNextRoute: (routeName?: OnboardingRoute, routeState?: Record<string, unknown>) => void
  goToPrevRoute: () => void
}>({
  isOnboardingRoute: false,
  goToNextRoute: () => {},
  goToPrevRoute: () => {}
})

type RouteNode = {
  name: string
  children: RouteNode[]
  /** Skipped by the flow - the step is done already, or has nothing to do */
  disabled: boolean
  /** Reachable only through in-app navigation, never by typing its url */
  isProtected: boolean
}

const route = (
  name: string,
  children: RouteNode[] = [],
  { disabled = false, isProtected = false } = {}
): RouteNode => ({ name, children, disabled, isProtected })

/** The first route named `name` in the tree, depth first. */
const findRouteNode = (node: RouteNode, name: string): RouteNode | null => {
  if (node.name === name) return node

  for (const child of node.children) {
    const found = findRouteNode(child, name)
    if (found) return found
  }

  return null
}

/**
 * The route to move on to among `nodes`: the one named `targetName` or, without one, the
 * first that is not disabled - looking into the children of a disabled one instead of it.
 */
const findNextEnabledRoute = (nodes: RouteNode[], targetName?: string): RouteNode | null => {
  if (targetName) {
    const node = nodes.find((n) => n.name === targetName)
    if (!node) return null

    return node.disabled ? findNextEnabledRoute(node.children) : node
  }

  const firstEnabled = nodes.find((node) => !node.disabled)
  if (firstEnabled) return firstEnabled

  for (const node of nodes) {
    const deepEnabled = findNextEnabledRoute(node.children)
    if (deepEnabled) return deepEnabled
  }

  return null
}

const ONBOARDING_HISTORY_STORAGE_KEY = 'onboarding_history'

const loadHistory = (): string[] => {
  try {
    const savedHistory = syncSessionStorage.get(ONBOARDING_HISTORY_STORAGE_KEY)
    if (savedHistory) return JSON.parse(savedHistory)
  } catch (error) {
    console.error('Failed to load navigation state:', error)
  }
  return []
}

/** The steps of an account adding flow after its own screen - leaving for any other ends it. */
const ACCOUNT_ADDING_FLOW_ROUTES: string[] = [
  WEB_ROUTES.keyStoreSetup,
  WEB_ROUTES.accountPicker,
  WEB_ROUTES.accountPersonalize
]

/** The steps of an account adding flow that come after the password is set. */
const ACCOUNT_ADDING_STEPS_AFTER_PASSWORD: string[] = [
  WEB_ROUTES.accountPicker,
  WEB_ROUTES.accountPersonalize
]

const selectHasPasswordSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.hasPasswordSecret
// Read before the controller states are loaded too
const selectAccountsCount = (state: AllControllersMappingType['AccountsController']) =>
  state.accounts?.length ?? 0
const selectIsSetupComplete = (state: AllControllersMappingType['WalletStateController']) =>
  state.isSetupComplete
const selectRecoverKeyStoreStatus = (state: AllControllersMappingType['EmailVaultController']) =>
  state.statuses?.recoverKeyStore
const selectPickerSubType = (state: AllControllersMappingType['AccountPickerController']) =>
  state.subType
// A flow is under way - set up (personalize prepares its accounts) or prepared already
const selectHasAccountAddingFlow = (state: AllControllersMappingType['AccountPickerController']) =>
  !!state.isInitialized || !!state.initParams || !!state.readyToAddAccounts?.length

const OnboardingNavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const { state: hasPasswordSecret } = useController('KeystoreController', selectHasPasswordSecret)
  const { state: recoverKeyStoreStatus } = useController(
    'EmailVaultController',
    selectRecoverKeyStoreStatus
  )
  const { path, params } = useRoute()
  const prevPath: string | undefined = usePrevious(path)
  const { navigate } = useNavigation()
  // Read straight off the router, so the callbacks below can resolve the route
  // they are moving on from without depending on a re-render for it.
  const routerHistory = useRouterHistory()
  const { authStatus } = useAuth()
  const { dispatch } = useControllersMiddleware()
  const { state: isSetupComplete } = useController('WalletStateController', selectIsSetupComplete)
  const { state: accountsCount } = useController('AccountsController', selectAccountsCount)
  const { state: subType, dispatch: accountPickerDispatch } = useController(
    'AccountPickerController',
    selectPickerSubType
  )
  const { state: hasAccountAddingFlow } = useController(
    'AccountPickerController',
    selectHasAccountAddingFlow
  )
  const isOnboardingRoute = ONBOARDING_WEB_ROUTES.includes((path || '').substring(1))
  const { areAllControllerStatesLoaded } = useContext(ControllersStateLoadedContext)

  const onboardingRoutesTree = useMemo(() => {
    // on mobile, we skip onboardingCompleted and go straight to the dashboard ('/')
    const afterPersonalizeRoutes = getUiType().isMobileApp
      ? [route('/')]
      : [
          route(WEB_ROUTES.onboardingCompleted, [route('/')], {
            disabled: isSetupComplete || !accountsCount,
            isProtected: true
          }),
          route('/')
        ]
    // Nothing to add (e.g. the accounts came with a sync), so the flow skips it
    const isPersonalizeDisabled = !hasAccountAddingFlow

    const accountPickerRoutes =
      subType === 'hw'
        ? [
            route(WEB_ROUTES.accountPicker, [
              route(WEB_ROUTES.accountPersonalize, afterPersonalizeRoutes, {
                disabled: isPersonalizeDisabled
              }),
              route('/')
            ])
          ]
        : [
            route(
              WEB_ROUTES.accountPersonalize,
              [...afterPersonalizeRoutes, route(WEB_ROUTES.accountPicker, [route('/')])],
              { disabled: isPersonalizeDisabled }
            )
          ]
    const passwordSetup = route(WEB_ROUTES.keyStoreSetup, accountPickerRoutes, {
      disabled: hasPasswordSecret,
      isProtected: true
    })
    const importMethod = (name: string) => route(name, [passwordSetup])

    return route(
      WEB_ROUTES.getStarted,
      [
        route(WEB_ROUTES.importExistingAccount, [
          // Once the password is set, the flow goes on past its step (the first enabled one)
          ...(hasPasswordSecret ? accountPickerRoutes : [passwordSetup]),
          importMethod(WEB_ROUTES.importPrivateKey),
          importMethod(WEB_ROUTES.importSeedPhrase),
          importMethod(WEB_ROUTES.ledgerConnect),
          importMethod(WEB_ROUTES.trezorConnect),
          route(WEB_ROUTES.safeImport, [
            importMethod(WEB_ROUTES.safeImportAddress),
            importMethod(WEB_ROUTES.safeImportByOwner)
          ]),
          importMethod(WEB_ROUTES.qrConnect),
          importMethod(WEB_ROUTES.importSmartAccountJson),
          // "Already an Ambire user" - a sync from the other app
          importMethod(WEB_ROUTES.importFromMobile),
          importMethod(MOBILE_ROUTES.importFromExtension)
        ]),
        importMethod(WEB_ROUTES.viewOnlyAccountAdder)
      ],
      { disabled: authStatus !== AUTH_STATUS.NOT_AUTHENTICATED }
    )
  }, [hasPasswordSecret, authStatus, isSetupComplete, subType, accountsCount, hasAccountAddingFlow])

  const [history, setHistory] = useState<string[]>(loadHistory)

  useEffect(() => {
    syncSessionStorage.set(ONBOARDING_HISTORY_STORAGE_KEY, JSON.stringify(history))
  }, [history])

  /**
   * `navigate` is rebuilt on every navigation. Keeping the latest one in a ref is
   * what lets the two callbacks below hold a stable identity: an effect that both
   * calls one of them and lists it as a dependency would otherwise re-run right
   * after its own navigation, and `goToNextRoute()` with no argument advances from
   * wherever the flow is by then - one step too far.
   */
  const navigateRef = useRef(navigate)
  const onboardingHistoryRef = useRef(history)

  useEffect(() => {
    navigateRef.current = navigate
  }, [navigate])

  useEffect(() => {
    onboardingHistoryRef.current = history
  }, [history])

  // `prevRoute` is stamped on every in-app navigation
  const getCameFrom = useCallback(
    () => (routerHistory.location.state as { prevRoute?: { pathname?: string } } | null)?.prevRoute,
    [routerHistory]
  )

  /**
   * The platform's own back - a swipe or Android's back on mobile, the browser's back
   * button on web - goes back without the breadcrumb knowing. Going back the same way keeps
   * the app's navigation in step with it: popping the screen from the native stack, or
   * stepping back in the browser history when the app navigated here. Returns whether it
   * went back.
   */
  const goBackThePlatformWay = useCallback(() => {
    if (getUiType().isMobileApp) return goBackInStack()
    if (!getCameFrom()) return false

    routerHistory.go(-1)
    return true
  }, [routerHistory, getCameFrom])

  const goToNextRoute = useCallback(
    (routeName?: OnboardingRoute, routeState?: Record<string, unknown>) => {
      const currentRoute = routerHistory.location.pathname?.substring(1) || '/'

      let nextRoute: RouteNode | null = null
      if (routeName && ONBOARDING_WEB_ROUTES.includes(routeName)) {
        // A flow names its step when it moves on right after setting the picker up, as the
        // tree lags behind that (the reply arrives before the state). The password still
        // comes first, as nothing can be added before it is set.
        const isWaitingForPassword =
          !hasPasswordSecret && ACCOUNT_ADDING_STEPS_AFTER_PASSWORD.includes(routeName)
        nextRoute = findRouteNode(
          onboardingRoutesTree,
          isWaitingForPassword ? WEB_ROUTES.keyStoreSetup : routeName
        )
      } else {
        const currentNode = findRouteNode(onboardingRoutesTree, currentRoute)
        if (!currentNode) return
        nextRoute = findNextEnabledRoute(currentNode.children, routeName)
      }
      if (!nextRoute) return

      // Going on to the screen the user came from (e.g. back to personalize from the picker
      // opened for more accounts) is going back to it, rather than stacking it again -
      // unless the navigation declares itself a step forward
      const isDeclaredForward = routeState?.navDirection === FORWARD_NAVIGATION_STATE.navDirection
      if (
        getCameFrom()?.pathname === `/${nextRoute.name}` &&
        !isDeclaredForward &&
        goBackThePlatformWay()
      ) {
        setHistory((prevHistory) => prevHistory.slice(0, -1))
        return
      }

      // The password is set once, so its step is replaced rather than left behind: every
      // way back - the back arrow, a swipe, the browser's - skips it, as the tree does
      const isLeavingPasswordSetup = currentRoute === WEB_ROUTES.keyStoreSetup

      if (nextRoute.name === '/' && !getUiType().isMobileApp) {
        dispatch({ type: 'OPEN_EXTENSION_POPUP' })
      } else {
        navigateRef.current(nextRoute.name, {
          state: { ...routeState, internal: true },
          replace: isLeavingPasswordSetup
        })
      }
      if (isLeavingPasswordSetup) return

      // Checked inside the updater rather than against a captured copy, so the
      // breadcrumb cannot pick up a duplicate from a stale read.
      setHistory((prevHistory) =>
        prevHistory.includes(currentRoute) ? prevHistory : [...prevHistory, currentRoute]
      )
    },
    [
      routerHistory,
      onboardingRoutesTree,
      hasPasswordSecret,
      dispatch,
      getCameFrom,
      goBackThePlatformWay
    ]
  )

  const goToPrevRoute = useCallback(() => {
    // The back arrow goes back the way the platform's own back does (see
    // `goBackThePlatformWay`) - the breadcrumb is only the way back otherwise
    if (goBackThePlatformWay()) {
      setHistory((prevHistory) => prevHistory.slice(0, -1))
      return
    }

    // The breadcrumb is read through its ref for the same reason as `navigate`
    // above. This one only ever runs from a back button, long after the render
    // that produced the value, so it is always the current one by then.
    const breadcrumb = onboardingHistoryRef.current
    // The last step not skipped - or one no longer in the tree, which ends the flow
    const prevIndex = breadcrumb.findLastIndex(
      (name) => !findRouteNode(onboardingRoutesTree, name)?.disabled
    )
    const prevRoute =
      prevIndex >= 0 ? findRouteNode(onboardingRoutesTree, breadcrumb[prevIndex]!) : null

    if (prevRoute) {
      // Onboarding walks its own route tree, so going back is a forward
      // navigation as far as the history is concerned. `navDirection` tells
      // the mobile card stack to play it as a back transition anyway.
      navigateRef.current(prevRoute.name, {
        state: { internal: true, ...BACK_NAVIGATION_STATE }
      })
      setHistory(breadcrumb.slice(0, prevIndex))
      return
    }

    // Every step left is skipped, so there is nowhere to go back to
    if (prevIndex < 0 && breadcrumb.length) return

    // Leaving the flow ends it. The reset effect below never runs in the popup, where
    // personalize can be reopened with the prepared accounts (see `getInitialRoute`).
    accountPickerDispatch({ type: 'method', params: { method: 'reset', args: [] } })
    navigateRef.current('/')
    setHistory([])
  }, [onboardingRoutesTree, goBackThePlatformWay, accountPickerDispatch])

  // Whether the last route (the root aside) was an onboarding one. Never in the popup.
  const wasOnOnboardingRouteRef = useRef(false)

  // Ends the account adding flow once the user leaves it - back to where it started, or
  // anywhere else. Only a move counts: flows prepare their accounts on their own screen,
  // and its own steps (the password setup, the picker and personalize) keep it. Reset
  // whether or not a flow seems under way: the state here can lag behind the flow that
  // just started, and resetting a picker with nothing in it costs one update.
  useEffect(() => {
    const currentRoute = path?.substring(1)
    if (!currentRoute) return

    const wasOnOnboardingRoute = wasOnOnboardingRouteRef.current
    wasOnOnboardingRouteRef.current =
      !getUiType().isPopup && ONBOARDING_WEB_ROUTES.includes(currentRoute)

    if (!wasOnOnboardingRoute || path === prevPath) return
    if (ACCOUNT_ADDING_FLOW_ROUTES.includes(currentRoute)) return

    accountPickerDispatch({ type: 'method', params: { method: 'reset', args: [] } })
  }, [path, prevPath, accountPickerDispatch])

  // Some routes are protected and should only be accessed through internal navigation.
  // If a user attempts to access one of these routes directly via the URL bar,
  // this hook should block the navigation and redirect them back to the previous route.
  useEffect(() => {
    if (getUiType().isPopup || getUiType().isMobileApp) return
    const currentRoute = path?.substring(1)
    const prevRoute = prevPath?.substring(1)
    if (!currentRoute || !prevRoute || !ONBOARDING_WEB_ROUTES.includes(currentRoute)) return

    const node = findRouteNode(onboardingRoutesTree, currentRoute)
    if (node && (!node.isProtected || params?.internal)) return

    navigate(prevRoute, { state: { internal: true } })
  }, [path, prevPath, params, navigate, onboardingRoutesTree])

  // Reset the onboarding history state in case we are no longer on an onboarding route
  useEffect(() => {
    if (path === '/' && history.length) {
      setHistory([])
    }
  }, [history.length, path])

  useEffect(() => {
    if (getUiType().isPopup || getUiType().isMobileApp) return

    const handleBackButton = () => {
      const changedRoute = window.location.hash.replace('#/', '')
      if (!onboardingHistoryRef.current.length) return
      if (!ONBOARDING_WEB_ROUTES.includes(changedRoute)) return
      if (!findRouteNode(onboardingRoutesTree, changedRoute)?.disabled) return

      goToPrevRoute()
    }

    window.addEventListener('hashchange', handleBackButton)

    return () => {
      window.removeEventListener('hashchange', handleBackButton)
    }
  }, [goToPrevRoute, onboardingRoutesTree])

  useEffect(() => {
    const currentRoute = path?.substring(1)
    if (!currentRoute) return
    if (!areAllControllerStatesLoaded) return
    if (recoverKeyStoreStatus !== 'INITIAL') return

    if (
      !hasPasswordSecret &&
      authStatus === AUTH_STATUS.AUTHENTICATED &&
      !ONBOARDING_WEB_ROUTES.includes(currentRoute)
    ) {
      goToNextRoute(WEB_ROUTES.keyStoreSetup)
    }
  }, [
    authStatus,
    path,
    goToNextRoute,
    hasPasswordSecret,
    areAllControllerStatesLoaded,
    recoverKeyStoreStatus
  ])

  const value = useMemo(
    () => ({
      isOnboardingRoute,
      goToNextRoute,
      goToPrevRoute
    }),
    [isOnboardingRoute, goToPrevRoute, goToNextRoute]
  )
  return (
    <OnboardingNavigationContext.Provider value={value}>
      {children}
    </OnboardingNavigationContext.Provider>
  )
}

export { OnboardingNavigationContext, OnboardingNavigationProvider }
