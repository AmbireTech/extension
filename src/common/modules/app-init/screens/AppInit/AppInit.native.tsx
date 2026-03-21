import React from 'react'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NativeRouter } from 'react-router-native'

import { BiometricsProvider } from '@common/contexts/biometricsContext'
import { ControllerStoreProvider } from '@common/contexts/controllerStoreContext'
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
import { ControllersStateLoadedProvider } from '@mobile/contexts/controllersStateLoadedContext'

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
                    <ControllersStateLoadedProvider>
                      <KeyboardProvider>
                        <NetInfoProvider>
                          <AuthProvider>
                            <BiometricsProvider>
                              <OnboardingNavigationProvider>
                                <AppRouter />
                                <PortalHost name="global" />
                              </OnboardingNavigationProvider>
                            </BiometricsProvider>
                          </AuthProvider>
                        </NetInfoProvider>
                      </KeyboardProvider>
                    </ControllersStateLoadedProvider>
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
