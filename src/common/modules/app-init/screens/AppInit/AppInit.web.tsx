import '@web/utils/instrument'

import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrowserRouter, HashRouter } from 'react-router-dom'

import ErrorComponent from '@common/components/ErrorBoundary'
import WithGlassViewSupport from '@common/components/GlassView/WithGlassViewSupport'
import { GlobalTooltip } from '@common/components/GlobalTooltip'
import { ErrorBoundary } from '@common/config/analytics/CrashAnalytics.web'
import { ControllerStoreProvider } from '@common/contexts/controllerStoreContext'
import { KeyboardProvider } from '@common/contexts/keyboardContext'
import { NetInfoProvider } from '@common/contexts/netInfoContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import AppRouter from '@common/modules/app-init/components/AppRouter'
import GestureHandler from '@common/modules/app-init/screens/AppInit/GestureHandler'
import { AuthProvider } from '@common/modules/auth/contexts/authContext'
import { OnboardingNavigationProvider } from '@common/modules/auth/contexts/onboardingNavigationContext'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { isExtension } from '@web/constants/browserapi'
import { ControllersMiddlewareProvider } from '@web/contexts/controllersMiddlewareContext'
import { ControllersStateLoadedProvider } from '@web/contexts/controllersStateLoadedContext'

const Router = isExtension ? HashRouter : BrowserRouter

const errorComponent = ({ error }: { error: Error }) => <ErrorComponent error={error} />

// Composed at runtime to avoid Babel JSX transform bug with very deep nesting (~40+ levels).
type ProviderComponent = React.ComponentType<{ children: React.ReactNode }>

const composeProviders = (
  providers: ProviderComponent[],
  children: React.ReactNode
): React.ReactNode =>
  providers.reduceRight<React.ReactNode>((acc, Provider) => <Provider>{acc}</Provider>, children)

const CONTROLLER_STATE_PROVIDERS: ProviderComponent[] = [
  // Reading from controllers in components, rendered above ControllersStateLoadedProvider
  // must be done very carefully, as it is not guaranteed that the state is loaded.
  ControllersStateLoadedProvider,
  KeyboardProvider,
  NetInfoProvider,
  AuthProvider,
  OnboardingNavigationProvider
]

const AppInit = () => {
  const { fontsLoaded } = useFonts()

  if (!fontsLoaded) return null

  const appContent = (
    <WithGlassViewSupport>
      <AppRouter />
      <PortalHost name="global" />
    </WithGlassViewSupport>
  )

  return (
    <Router>
      <PortalProvider>
        <GlobalTooltip />
        <SafeAreaProvider>
          <ToastProvider>
            <ErrorBoundary fallback={errorComponent as any}>
              <ControllerStoreProvider>
                <ControllersMiddlewareProvider>
                  <ThemeProvider>
                    <GestureHandler>
                      {composeProviders(CONTROLLER_STATE_PROVIDERS, appContent)}
                    </GestureHandler>
                  </ThemeProvider>
                </ControllersMiddlewareProvider>
              </ControllerStoreProvider>
            </ErrorBoundary>
          </ToastProvider>
        </SafeAreaProvider>
      </PortalProvider>
    </Router>
  )
}

export default AppInit
