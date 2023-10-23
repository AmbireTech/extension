// @ts-nocheck TODO: fix provider types

import { areRpcProvidersInitialized, initRpcProviders } from 'ambire-common/src/services/provider'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { AccountsProvider } from '@common/contexts/accountsContext'
import { AddressBookProvider } from '@common/contexts/addressBookContext'
import { BiometricsProvider } from '@common/contexts/biometricsContext'
import { ConstantsProvider } from '@common/contexts/constantsContext'
import { GasTankProvider } from '@common/contexts/gasTankContext'
import { GnosisProvider } from '@common/contexts/gnosisContext'
import { HeaderBottomSheetProvider } from '@common/contexts/headerBottomSheetContext'
import { KeyboardProvider } from '@common/contexts/keyboardContext'
import { LinkingProvider } from '@common/contexts/linkingContext'
import { LoaderProvider } from '@common/contexts/loaderContext'
import { NetInfoProvider } from '@common/contexts/netInfoContext'
import { NetworkProvider } from '@common/contexts/networkContext'
import { PortfolioProvider } from '@common/contexts/portfolioContext'
import { PrivateModeProvider } from '@common/contexts/privateModeContext'
import { RequestsProvider } from '@common/contexts/requestsContext'
import { RewardsProvider } from '@common/contexts/rewardsContext'
import { StorageProvider } from '@common/contexts/storageContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import AppRouter from '@common/modules/app-init/components/AppRouter'
import { AuthProvider } from '@common/modules/auth/contexts/authContext'
import { navigationContainerDarkTheme } from '@common/modules/router/styles'
import { VaultProvider } from '@common/modules/vault/contexts/vaultContext'
import { navigationRef, routeNameRef } from '@common/services/navigation'
import { rpcProviders } from '@common/services/providers'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { Web3Provider } from '@mobile/modules/web3/contexts/web3Context'
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
  const { fontsLoaded } = useFonts()

  if (!fontsLoaded) return null

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
                          <AccountsProvider>
                            <NetworkProvider>
                              <VaultProvider>
                                <RequestsProvider>
                                  <Web3Provider>
                                    <PortfolioProvider>
                                      <RewardsProvider>
                                        <GnosisProvider>
                                          <GasTankProvider>
                                            <BiometricsProvider>
                                              <AddressBookProvider>
                                                <PrivateModeProvider>
                                                  <HeaderBottomSheetProvider>
                                                    <LinkingProvider>
                                                      <AppRouter />
                                                    </LinkingProvider>
                                                  </HeaderBottomSheetProvider>
                                                </PrivateModeProvider>
                                                <PortalHost name="global" />
                                              </AddressBookProvider>
                                            </BiometricsProvider>
                                          </GasTankProvider>
                                        </GnosisProvider>
                                      </RewardsProvider>
                                    </PortfolioProvider>
                                  </Web3Provider>
                                </RequestsProvider>
                              </VaultProvider>
                            </NetworkProvider>
                          </AccountsProvider>
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
