// @ts-nocheck TODO: fix provider types

import { areRpcProvidersInitialized, initRpcProviders } from 'ambire-common/src/services/provider'
import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrowserRouter, HashRouter } from 'react-router-dom'

import { AccountsProvider } from '@common/contexts/accountsContext'
import { AddressBookProvider } from '@common/contexts/addressBookContext'
import { AmbireExtensionProvider } from '@common/contexts/ambireExtensionContext'
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
import { StorageProvider } from '@common/contexts/storageContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import AppRouter from '@common/modules/app-init/components/AppRouter'
import { AuthProvider } from '@common/modules/auth/contexts/authContext'
import { VaultProvider } from '@common/modules/vault/contexts/vaultContext'
import { rpcProviders } from '@common/services/providers'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { isExtension } from '@web/constants/browserapi'
import { ApprovalProvider } from '@web/contexts/approvalContext'
import { OnboardingProvider } from '@web/modules/onboarding/contexts/onboardingContext'

// Initialize rpc providers for all networks
const shouldInitProviders = !areRpcProvidersInitialized()
if (shouldInitProviders) {
  initRpcProviders(rpcProviders)
}

const Router = isExtension ? HashRouter : BrowserRouter

const AppInit = () => {
  const { fontsLoaded } = useFonts()

  if (!fontsLoaded) return null

  return (
    <Router>
      <PortalProvider>
        <LoaderProvider>
          <StorageProvider>
            <OnboardingProvider>
              <ThemeProvider>
                <SafeAreaProvider>
                  <KeyboardProvider>
                    <NetInfoProvider>
                      <ToastProvider>
                        <ConstantsProvider>
                          <AuthProvider>
                            <AccountsProvider>
                              <NetworkProvider>
                                <ApprovalProvider>
                                  <PortfolioProvider>
                                    <GnosisProvider>
                                      <AmbireExtensionProvider>
                                        <VaultProvider>
                                          <RequestsProvider>
                                            <BiometricsProvider>
                                              <AddressBookProvider>
                                                <PrivateModeProvider>
                                                  <GasTankProvider>
                                                    <HeaderBottomSheetProvider>
                                                      <LinkingProvider>
                                                        <AppRouter />
                                                      </LinkingProvider>
                                                    </HeaderBottomSheetProvider>
                                                  </GasTankProvider>
                                                </PrivateModeProvider>
                                                <PortalHost name="global" />
                                              </AddressBookProvider>
                                            </BiometricsProvider>
                                          </RequestsProvider>
                                        </VaultProvider>
                                      </AmbireExtensionProvider>
                                    </GnosisProvider>
                                  </PortfolioProvider>
                                </ApprovalProvider>
                              </NetworkProvider>
                            </AccountsProvider>
                          </AuthProvider>
                        </ConstantsProvider>
                      </ToastProvider>
                    </NetInfoProvider>
                  </KeyboardProvider>
                </SafeAreaProvider>
              </ThemeProvider>
            </OnboardingProvider>
          </StorageProvider>
        </LoaderProvider>
      </PortalProvider>
    </Router>
  )
}

export default AppInit
