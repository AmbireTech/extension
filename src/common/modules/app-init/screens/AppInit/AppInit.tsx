// @ts-nocheck TODO: fix provider types

import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { BiometricsProvider } from '@common/contexts/biometricsContext'
import { ConstantsProvider } from '@common/contexts/constantsContext'
import { KeyboardProvider } from '@common/contexts/keyboardContext'
import { NetInfoProvider } from '@common/contexts/netInfoContext'
import { StorageProvider } from '@common/contexts/storageContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import AppRouter from '@common/modules/app-init/components/AppRouter'
import { AuthProvider } from '@common/modules/auth/contexts/authContext'
import { navigationContainerDarkTheme } from '@common/modules/router/styles'
import { navigationRef, routeNameRef } from '@common/services/navigation'
import { PortalHost, PortalProvider } from '@gorhom/portal'
// TODO: v2
// import { Web3Provider } from '@mobile/modules/web3/contexts/web3Context'
import { NavigationContainer } from '@react-navigation/native'

const handleOnReady = () => {
  // @ts-ignore for some reason TS complains about this 👇
  routeNameRef.current = navigationRef.current.getCurrentRoute()?.name
}

const AppInit = () => {
  const { fontsLoaded, robotoFontsLoaded } = useFonts()

  if (!fontsLoaded && !robotoFontsLoaded) return null

  return (
    <NavigationContainer
      // Part of the mechanism for being able to navigate without the navigation prop.
      // For more details, see the NavigationService.
      ref={navigationRef}
      onReady={handleOnReady}
      theme={navigationContainerDarkTheme}
    >
      <PortalProvider>
        <StorageProvider>
          <ThemeProvider>
            <SafeAreaProvider>
              <KeyboardProvider>
                <NetInfoProvider>
                  <ToastProvider>
                    <ConstantsProvider>
                      <AuthProvider>
                        {/* TODO: v2 */}
                        {/* <Web3Provider> */}
                        <BiometricsProvider>
                          <AppRouter />
                          <PortalHost name="global" />
                        </BiometricsProvider>
                        {/* </Web3Provider> */}
                      </AuthProvider>
                    </ConstantsProvider>
                  </ToastProvider>
                </NetInfoProvider>
              </KeyboardProvider>
            </SafeAreaProvider>
          </ThemeProvider>
        </StorageProvider>
      </PortalProvider>
    </NavigationContainer>
  )
}

export default AppInit
