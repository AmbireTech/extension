// @ts-nocheck TODO: fix provider types

import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { areRpcProvidersInitialized, initRpcProviders } from '@ambire-common/services/provider'
import { BiometricsProvider } from '@common/contexts/biometricsContext'
import { ConstantsProvider } from '@common/contexts/constantsContext'
import { KeyboardProvider } from '@common/contexts/keyboardContext'
import { LoaderProvider } from '@common/contexts/loaderContext'
import { NetInfoProvider } from '@common/contexts/netInfoContext'
import { PrivateModeProvider } from '@common/contexts/privateModeContext'
import { StorageProvider } from '@common/contexts/storageContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import AppRouter from '@common/modules/app-init/components/AppRouter'
import { AuthProvider } from '@common/modules/auth/contexts/authContext'
import { navigationContainerDarkTheme } from '@common/modules/router/styles'
import { navigationRef, routeNameRef } from '@common/services/navigation'
import { rpcProviders } from '@common/services/providers'
import { PortalHost, PortalProvider } from '@gorhom/portal'
// TODO: v2
// import { Web3Provider } from '@mobile/modules/web3/contexts/web3Context'
import { NavigationContainer } from '@react-navigation/native'

// Initialize rpc providers for all networks
const shouldInitProviders = !areRpcProvidersInitialized()
if (shouldInitProviders) {
  initRpcProviders(rpcProviders)
}

const handleOnReady = () => {
  // @ts-ignore for some reason TS complains about this 👇
  routeNameRef.current = navigationRef.current.getCurrentRoute()?.name
}

const AppInit = () => {
  const { fontsLoaded, robotoFontsLoaded } = useFonts()

  if (!fontsLoaded || !robotoFontsLoaded) return null

  return (
    <NavigationContainer
      // Part of the mechanism for being able to navigate without the navigation prop.
      // For more details, see the NavigationService.
      ref={navigationRef}
      onReady={handleOnReady}
      theme={navigationContainerDarkTheme}
    >
      <PortalProvider>
        <LoaderProvider>
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
                            <PrivateModeProvider>
                              <AppRouter />
                            </PrivateModeProvider>
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
        </LoaderProvider>
      </PortalProvider>
    </NavigationContainer>
  )
}

export default AppInit
