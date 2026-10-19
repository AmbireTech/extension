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
import useRouterHistory from '@common/hooks/useRouterHistory'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import {
  BACK_NAVIGATION_STATE,
  MOBILE_ROUTES,
  ONBOARDING_WEB_ROUTES,
  WEB_ROUTES
} from '@common/modules/router/constants/common'
import { syncSessionStorage } from '@common/services/storage'
import { getUiType } from '@common/utils/uiType'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

export type OnboardingRoute = (typeof ONBOARDING_WEB_ROUTES)[number]
type HwWalletsNeedingRedirect = 'trezor' | 'lattice' | null

const OnboardingNavigationContext = createContext<{
  isOnboardingRoute: boolean
  goToNextRoute: (routeName?: OnboardingRoute, routeState?: Record<string, unknown>) => void
  goToPrevRoute: () => void
  setTriggeredHwWalletFlow: React.Dispatch<React.SetStateAction<HwWalletsNeedingRedirect>>
}>({
  isOnboardingRoute: false,
  goToNextRoute: () => {},
  goToPrevRoute: () => {},
  setTriggeredHwWalletFlow: () => null
})

class RouteNode {
  name: string

  children: RouteNode[] = []

  disabled: boolean = false

  isProtected: boolean = true

  constructor(name: string, children: RouteNode[] = [], disabled = false, isProtected = true) {
    this.name = name
    if (children) this.children = children
    this.disabled = disabled
    this.isProtected = isProtected
  }
}

/** The steps of an account adding flow after its own screen - leaving for any other ends it. */
const ACCOUNT_ADDING_FLOW_ROUTES: string[] = [
  WEB_ROUTES.keyStoreSetup,
  WEB_ROUTES.accountPicker,
  WEB_ROUTES.accountPersonalize
]

const selectHasPasswordSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.hasPasswordSecret
const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

const OnboardingNavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const { state: hasPasswordSecret } = useController('KeystoreController', selectHasPasswordSecret)
  const { statuses: emailVaultStatuses } = useController('EmailVaultController').state
  const { path, params } = useRoute()
  const prevPath: string | undefined = usePrevious(path)
  const { navigate } = useNavigation()
  // Read straight off the router, so the callbacks below can resolve the route
  // they are moving on from without depending on a re-render for it.
  const routerHistory = useRouterHistory()
  const { authStatus } = useAuth()
  const { dispatch } = useControllersMiddleware()
  const { isSetupComplete } = useController('WalletStateController').state
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const {
    state: { isInitialized, subType, initParams, type, readyToAddAccounts },
    dispatch: accountPickerDispatch
  } = useController('AccountPickerController')
  // Prepared by the flow for the personalize step, which adds them on proceeding
  const hasPreparedAccounts = !!readyToAddAccounts?.length
  // A flow is under way - set up (personalize prepares its accounts) or prepared already
  const hasAccountAddingFlow = isInitialized || !!initParams || hasPreparedAccounts
  const isOnboardingRoute = useMemo(
    () => ONBOARDING_WEB_ROUTES.includes((path || '').substring(1)),
    [path]
  )
  const { areAllControllerStatesLoaded } = useContext(ControllersStateLoadedContext)

  const onboardingRoutesTree = useMemo(() => {
    // on mobile, we skip onboardingCompleted and go straight to the dashboard ('/')
    const afterPersonalizeRoutes = getUiType().isMobileApp
      ? [new RouteNode('/')]
      : [
          new RouteNode(
            WEB_ROUTES.onboardingCompleted,
            [new RouteNode('/')],
            isSetupComplete || !accounts?.length
          ),
          new RouteNode('/')
        ]

    const nextAccountPickerRoutes =
      subType === 'hw'
        ? [
            new RouteNode(
              WEB_ROUTES.accountPicker,
              [
                new RouteNode(
                  WEB_ROUTES.accountPersonalize,
                  afterPersonalizeRoutes,
                  !hasAccountAddingFlow,
                  false
                ),
                new RouteNode('/')
              ],
              false,
              false
            )
          ]
        : [
            new RouteNode(
              WEB_ROUTES.accountPersonalize,
              [
                ...afterPersonalizeRoutes,
                new RouteNode(WEB_ROUTES.accountPicker, [new RouteNode('/')], false, false)
              ],
              // Nothing to add (e.g. the accounts came with a sync), so the flow skips it
              !hasAccountAddingFlow,
              false
            )
          ]
    const common = [
      new RouteNode(WEB_ROUTES.keyStoreSetup, nextAccountPickerRoutes, hasPasswordSecret)
    ]

    return new RouteNode(
      WEB_ROUTES.getStarted,
      [
        new RouteNode(
          WEB_ROUTES.importExistingAccount,
          [
            ...(common && common[0] && common[0].disabled ? common[0].children : common),
            new RouteNode(WEB_ROUTES.importPrivateKey, common, false, false),
            new RouteNode(WEB_ROUTES.importSeedPhrase, common, false, false),
            new RouteNode(WEB_ROUTES.ledgerConnect, common, false, false),
            new RouteNode(WEB_ROUTES.trezorConnect, common, false, false),
            new RouteNode(
              WEB_ROUTES.safeImport,
              [
                new RouteNode(WEB_ROUTES.safeImportAddress, common, false, false),
                new RouteNode(WEB_ROUTES.safeImportByOwner, common, false, false)
              ],
              false,
              false
            ),
            new RouteNode(WEB_ROUTES.qrConnect, common, false, false),
            new RouteNode(WEB_ROUTES.importSmartAccountJson, common, false, false)
          ],
          false,
          false
        ),
        new RouteNode(WEB_ROUTES.viewOnlyAccountAdder, common, false, false),
        new RouteNode(WEB_ROUTES.importFromMobile, common, false, false),
        new RouteNode(MOBILE_ROUTES.importFromExtension, common, false, false)
      ],
      authStatus !== AUTH_STATUS.NOT_AUTHENTICATED,
      false
    )
  }, [
    hasPasswordSecret,
    authStatus,
    isSetupComplete,
    subType,
    accounts?.length,
    hasAccountAddingFlow
  ])

  const loadHistory = () => {
    try {
      const savedHistory = syncSessionStorage.get('onboarding_history')
      if (savedHistory) return JSON.parse(savedHistory)
    } catch (error) {
      console.error('Failed to load navigation state:', error)
    }
    return []
  }

  const [history, setHistory] = useState<string[]>(loadHistory())

  useEffect(() => {
    syncSessionStorage.set('onboarding_history', JSON.stringify(history))
  }, [history])

  const deepSearchRouteNode = useCallback(
    (node: RouteNode, routeName: string): RouteNode | null => {
      if (node.name === routeName) return node

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          const found = deepSearchRouteNode(child, routeName)
          if (found) return found
        }
      }

      return null
    },
    []
  )

  const findNextEnabledRoute = useCallback(
    (nodes: RouteNode[], targetName?: OnboardingRoute): RouteNode | null => {
      if (targetName) {
        const node = nodes.find((n) => n.name === targetName)

        if (!node) return null

        if (!node.disabled) {
          return node
        }

        return findNextEnabledRoute(node.children)
      }

      const firstEnabled = nodes.find((node) => !node.disabled)
      if (firstEnabled) return firstEnabled

      for (const node of nodes) {
        if (node.children && node.children.length > 0) {
          const deepEnabled = findNextEnabledRoute(node.children)
          if (deepEnabled) return deepEnabled
        }
      }

      return null
    },
    []
  )

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

  const goToNextRoute = useCallback(
    (routeName?: OnboardingRoute, routeState?: Record<string, unknown>) => {
      const currentRoute = routerHistory.location.pathname?.substring(1) || '/'

      let nextRoute: RouteNode | null = null
      if (routeName && ONBOARDING_WEB_ROUTES.includes(routeName)) {
        nextRoute = deepSearchRouteNode(onboardingRoutesTree, routeName)
      } else {
        const currentNode = deepSearchRouteNode(onboardingRoutesTree, currentRoute)
        if (!currentNode) return
        nextRoute = findNextEnabledRoute(currentNode.children, routeName)
      }
      if (nextRoute) {
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
      }
    },
    [routerHistory, onboardingRoutesTree, findNextEnabledRoute, deepSearchRouteNode, dispatch]
  )

  const goToPrevRoute = useCallback(() => {
    // The breadcrumb is read through its ref for the same reason as `navigate`
    // above. This one only ever runs from a back button, long after the render
    // that produced the value, so it is always the current one by then.
    const currentOnboardingHistory = onboardingHistoryRef.current
    const newHistory = [...currentOnboardingHistory]

    if (!currentOnboardingHistory.length) {
      navigateRef.current('/')
      setHistory([])
      return
    }

    while (newHistory.length > 0) {
      const prevRouteName = newHistory[newHistory.length - 1]
      const prevRoute = deepSearchRouteNode(onboardingRoutesTree, prevRouteName!)
      newHistory.pop()
      if (!prevRoute) {
        navigateRef.current('/')
        setHistory([])
        return
      }

      if (!prevRoute.disabled) {
        // Onboarding walks its own route tree, so going back is a forward
        // navigation as far as the history is concerned. `navDirection` tells
        // the mobile card stack to play it as a back transition anyway.
        navigateRef.current(prevRoute.name, {
          state: { internal: true, ...BACK_NAVIGATION_STATE }
        })
        setHistory(newHistory)
        return
      }
    }
  }, [deepSearchRouteNode, onboardingRoutesTree])

  const [onboardingInitialized, setOnboardingInitialized] = useState(false)
  const [triggeredHwWalletFlow, setTriggeredHwWalletFlow] = useState<HwWalletsNeedingRedirect>(null)

  useEffect(() => {
    if (getUiType().isPopup) return

    const currentRoute = path?.substring(1)
    if (!currentRoute) return

    if (ONBOARDING_WEB_ROUTES.includes(currentRoute) && !onboardingInitialized) {
      setOnboardingInitialized(true)
    }

    if (!ONBOARDING_WEB_ROUTES.includes(currentRoute) && onboardingInitialized) {
      setOnboardingInitialized(false)
    }
  }, [onboardingInitialized, path])

  useEffect(() => {
    const shouldRedirectToHwWalletFlow =
      initParams && type && ['lattice', 'trezor'].includes(type) && triggeredHwWalletFlow
    if (shouldRedirectToHwWalletFlow) {
      setTriggeredHwWalletFlow(null)

      const currentRoute = path?.substring(1)
      const nextRoute =
        currentRoute && ONBOARDING_WEB_ROUTES.includes(currentRoute)
          ? undefined
          : WEB_ROUTES.accountPicker
      goToNextRoute(nextRoute)
    }
  }, [goToNextRoute, initParams, type, triggeredHwWalletFlow, path])

  // Ends the account adding flow once the user leaves it - back to where it started, or
  // anywhere else. Only a move counts: flows prepare their accounts on their own screen,
  // and its own steps (the password setup, the picker and personalize) keep it.
  useEffect(() => {
    if (!onboardingInitialized) return
    if (path === prevPath) return
    if (!hasAccountAddingFlow) return

    const currentRoute = path?.substring(1) || ''
    if (!currentRoute || ACCOUNT_ADDING_FLOW_ROUTES.includes(currentRoute)) return

    accountPickerDispatch({ type: 'method', params: { method: 'reset', args: [] } })
  }, [onboardingInitialized, path, prevPath, hasAccountAddingFlow, accountPickerDispatch])

  // Some routes are protected and should only be accessed through internal navigation.
  // If a user attempts to access one of these routes directly via the URL bar,
  // this hook should block the navigation and redirect them back to the previous route.
  useEffect(() => {
    if (getUiType().isPopup || getUiType().isMobileApp) return
    const currentRoute = path?.substring(1)
    const prevRoute = prevPath?.substring(1)
    if (!currentRoute) return
    if (!ONBOARDING_WEB_ROUTES.includes(currentRoute)) return
    const node = deepSearchRouteNode(onboardingRoutesTree, currentRoute)

    if (!node) {
      !!prevRoute && navigate(prevRoute, { state: { internal: true } })
      return
    }

    if (node.isProtected) {
      if (!params || !params.internal) {
        !!prevRoute && navigate(prevRoute, { state: { internal: true } })
      }
    }
  }, [path, prevPath, params, deepSearchRouteNode, navigate, onboardingRoutesTree, history])

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
      if (!history.length) return
      if (!ONBOARDING_WEB_ROUTES.includes(changedRoute)) return

      const node = deepSearchRouteNode(onboardingRoutesTree, changedRoute)
      if (!node?.disabled) return

      goToPrevRoute()
    }

    window.addEventListener('hashchange', handleBackButton)

    return () => {
      window.removeEventListener('hashchange', handleBackButton)
    }
  }, [goToPrevRoute, history, deepSearchRouteNode, onboardingRoutesTree])

  useEffect(() => {
    const currentRoute = path?.substring(1)
    if (!currentRoute) return
    if (!areAllControllerStatesLoaded) return
    if (emailVaultStatuses?.recoverKeyStore !== 'INITIAL') return

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
    emailVaultStatuses?.recoverKeyStore
  ])

  const value = useMemo(
    () => ({
      isOnboardingRoute,
      goToNextRoute,
      goToPrevRoute,
      setTriggeredHwWalletFlow
    }),
    [isOnboardingRoute, goToPrevRoute, goToNextRoute, setTriggeredHwWalletFlow]
  )
  return (
    <OnboardingNavigationContext.Provider value={value}>
      {children}
    </OnboardingNavigationContext.Provider>
  )
}

export { OnboardingNavigationContext, OnboardingNavigationProvider }
