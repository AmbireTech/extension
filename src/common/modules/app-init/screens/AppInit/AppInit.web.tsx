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
import { getUiType } from '@web/utils/uiType'

const Router = isExtension ? HashRouter : BrowserRouter

const errorComponent = ({ error }: { error: Error }) => <ErrorComponent error={error} />

// Composed at runtime to avoid Babel JSX transform bug with very deep nesting (~40+ levels).
type ProviderComponent = React.ComponentType<{ children: React.ReactNode }>

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
              <ControllerStoreProvider withErrorToasts>
                <ControllersMiddlewareProvider>
                  <ThemeProvider>
                    <GestureHandler>
                      <ControllersStateLoadedProvider>
                        <KeyboardProvider>
                          <NetInfoProvider>
                            <AuthProvider>
                              <OnboardingNavigationProvider uiType={getUiType().uiType}>
                                {appContent}
                              </OnboardingNavigationProvider>
                            </AuthProvider>
                          </NetInfoProvider>
                        </KeyboardProvider>
                      </ControllersStateLoadedProvider>
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
