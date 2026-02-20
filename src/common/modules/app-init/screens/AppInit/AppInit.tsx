import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NativeRouter } from 'react-router-native'

import WithGlassViewSupport from '@common/components/GlassView/WithGlassViewSupport'
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
import { ControllersMiddlewareProvider } from '@mobile/contexts/controllersMiddlewareContext'

const AppInit = () => {
  const { fontsLoaded } = useFonts()

  if (!fontsLoaded) return null

  return (
    <NativeRouter>
      <PortalProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <ControllerStoreProvider withErrorToasts>
              <ControllersMiddlewareProvider>
                <ThemeProvider>
                  <GestureHandler>
                    <KeyboardProvider>
                      <NetInfoProvider>
                        <AuthProvider>
                          <OnboardingNavigationProvider>
                            <WithGlassViewSupport>
                              <AppRouter />
                              <PortalHost name="global" />
                            </WithGlassViewSupport>
                          </OnboardingNavigationProvider>
                        </AuthProvider>
                      </NetInfoProvider>
                    </KeyboardProvider>
                  </GestureHandler>
                </ThemeProvider>
              </ControllersMiddlewareProvider>
            </ControllerStoreProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </PortalProvider>
    </NativeRouter>
  )
}

export default AppInit
