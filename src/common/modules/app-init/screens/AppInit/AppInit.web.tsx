// @ts-nocheck TODO: fix provider types

import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrowserRouter, HashRouter } from 'react-router-dom'

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
import { rpcProviders } from '@common/services/providers'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { isExtension } from '@web/constants/browserapi'
import { AccountAdderControllerStateProvider } from '@web/contexts/accountAdderControllerStateContext'
import { ActivityControllerStateProvider } from '@web/contexts/activityControllerStateContext'
import { BackgroundServiceProvider } from '@web/contexts/backgroundServiceContext'
import { ControllersStateLoadedProvider } from '@web/contexts/controllersStateLoadedContext'
import { ExtensionProvider } from '@web/contexts/extensionContext'
import { KeystoreControllerStateProvider } from '@web/contexts/keystoreControllerStateContext'
import { MainControllerStateProvider } from '@web/contexts/mainControllerStateContext'
import { NotificationControllerStateProvider } from '@web/contexts/notificationControllerStateContext'
import { PortfolioControllerStateProvider } from '@web/contexts/portfolioControllerStateContext'
import { SettingsControllerStateProvider } from '@web/contexts/settingsControllerStateContext'
import { SignMessageControllerStateProvider } from '@web/contexts/signMessageControllerStateContext'
import { OnboardingProvider } from '@web/modules/onboarding/contexts/onboardingContext'

// Initialize rpc providers for all networks
// @TODO: get rid of this and use the rpc providers from the settings controller
const shouldInitProviders = !areRpcProvidersInitialized()
if (shouldInitProviders) {
  initRpcProviders(rpcProviders)
}

const Router = isExtension ? HashRouter : BrowserRouter

const AppInit = () => {
  const { fontsLoaded, robotoFontsLoaded } = useFonts()

  if (!fontsLoaded && !robotoFontsLoaded) return null

  return (
    <Router>
      <PortalProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <ToastProvider>
              <BackgroundServiceProvider>
                <MainControllerStateProvider>
                  <SettingsControllerStateProvider>
                    <AccountAdderControllerStateProvider>
                      <KeystoreControllerStateProvider>
                        <SignMessageControllerStateProvider>
                          <ActivityControllerStateProvider>
                            <NotificationControllerStateProvider>
                              <PortfolioControllerStateProvider>
                                <ControllersStateLoadedProvider>
                                  <LoaderProvider>
                                    <StorageProvider>
                                      <OnboardingProvider>
                                        <KeyboardProvider>
                                          <NetInfoProvider>
                                            <ConstantsProvider>
                                              <AuthProvider>
                                                <ExtensionProvider>
                                                  <BiometricsProvider>
                                                    <PrivateModeProvider>
                                                      <AppRouter />
                                                    </PrivateModeProvider>
                                                    <PortalHost name="global" />
                                                  </BiometricsProvider>
                                                </ExtensionProvider>
                                              </AuthProvider>
                                            </ConstantsProvider>
                                          </NetInfoProvider>
                                        </KeyboardProvider>
                                      </OnboardingProvider>
                                    </StorageProvider>
                                  </LoaderProvider>
                                </ControllersStateLoadedProvider>
                              </PortfolioControllerStateProvider>
                            </NotificationControllerStateProvider>
                          </ActivityControllerStateProvider>
                        </SignMessageControllerStateProvider>
                      </KeystoreControllerStateProvider>
                    </AccountAdderControllerStateProvider>
                  </SettingsControllerStateProvider>
                </MainControllerStateProvider>
              </BackgroundServiceProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </PortalProvider>
    </Router>
  )
}

export default AppInit
