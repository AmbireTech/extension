// @ts-nocheck TODO: fix provider types
import '@web/utils/instrument'

import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrowserRouter, HashRouter } from 'react-router-dom'

import ErrorComponent from '@common/components/ErrorBoundary'
import { ErrorBoundary } from '@common/config/analytics/CrashAnalytics.web'
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
import { AccountPickerControllerStateProvider } from '@web/contexts/accountPickerControllerStateContext'
import { AccountsControllerStateProvider } from '@web/contexts/accountsControllerStateContext'
import { ActivityControllerStateProvider } from '@web/contexts/activityControllerStateContext'
import { AddressBookControllerStateProvider } from '@web/contexts/addressBookControllerStateContext'
import { AutoLockControllerStateProvider } from '@web/contexts/autoLockControllerStateContext'
import { BackgroundServiceProvider } from '@web/contexts/backgroundServiceContext'
import { BannerControllerStateProvider } from '@web/contexts/bannerControllerStateContext/bannerControllerStateContext'
import { ContractNamesControllerStateProvider } from '@web/contexts/contractNamesControllerStateContext'
import { ControllersStateLoadedProvider } from '@web/contexts/controllersStateLoadedContext'
import { DappsControllerStateProvider } from '@web/contexts/dappsControllerStateContext'
import { DomainsControllerStateProvider } from '@web/contexts/domainsControllerStateContext'
import { EmailVaultControllerStateProvider } from '@web/contexts/emailVaultControllerStateContext'
import { ExtensionUpdateControllerStateProvider } from '@web/contexts/extensionUpdateControllerStateContext'
import { FeatureFlagsControllerStateProvider } from '@web/contexts/featureFlagsControllerStateContext'
import { InviteControllerStateProvider } from '@web/contexts/inviteControllerStateContext'
import { KeystoreControllerStateProvider } from '@web/contexts/keystoreControllerStateContext'
import { MainControllerStateProvider } from '@web/contexts/mainControllerStateContext'
import { NetworksControllerStateProvider } from '@web/contexts/networksControllerStateContext'
import { PhishingControllerStateProvider } from '@web/contexts/phishingControllerStateContext'
import { PortfolioControllerStateProvider } from '@web/contexts/portfolioControllerStateContext'
import { ProvidersControllerStateProvider } from '@web/contexts/providersControllerStateContext'
import { RequestsControllerStateProvider } from '@web/contexts/requestsControllerStateContext'
import { SelectedAccountControllerStateProvider } from '@web/contexts/selectedAccountControllerStateContext'
import { SignMessageControllerStateProvider } from '@web/contexts/signMessageControllerStateContext'
import { StorageControllerStateProvider } from '@web/contexts/storageControllerStateContext'
import { SwapAndBridgeControllerStateProvider } from '@web/contexts/swapAndBridgeControllerStateContext'
import { TransferControllerStateProvider } from '@web/contexts/transferControllerStateContext'
import { UiControllerStateProvider } from '@web/contexts/uiControllerStateContext'
import { WalletStateControllerProvider } from '@web/contexts/walletStateControllerContext'

const Router = isExtension ? HashRouter : BrowserRouter

const errorComponent = ({ error }: { error: Error }) => <ErrorComponent error={error} />

const AppInit = () => {
  const { fontsLoaded, robotoFontsLoaded } = useFonts()

  if (!fontsLoaded && !robotoFontsLoaded) return null

  return (
    <Router>
      <PortalProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <ErrorBoundary fallback={errorComponent}>
              <BackgroundServiceProvider>
                <MainControllerStateProvider>
                  <StorageControllerStateProvider>
                    <UiControllerStateProvider>
                      <WalletStateControllerProvider>
                        <ThemeProvider>
                          <GestureHandler>
                            <NetworksControllerStateProvider>
                              <AccountsControllerStateProvider>
                                <SelectedAccountControllerStateProvider>
                                  <ProvidersControllerStateProvider>
                                    <AutoLockControllerStateProvider>
                                      <ExtensionUpdateControllerStateProvider>
                                        <FeatureFlagsControllerStateProvider>
                                          <InviteControllerStateProvider>
                                            <AccountPickerControllerStateProvider>
                                              <KeystoreControllerStateProvider>
                                                <SignMessageControllerStateProvider>
                                                  <ActivityControllerStateProvider>
                                                    <RequestsControllerStateProvider>
                                                      <PortfolioControllerStateProvider>
                                                        <BannerControllerStateProvider>
                                                          <EmailVaultControllerStateProvider>
                                                            <PhishingControllerStateProvider>
                                                              <DappsControllerStateProvider>
                                                                <DomainsControllerStateProvider>
                                                                  <ContractNamesControllerStateProvider>
                                                                    <AddressBookControllerStateProvider>
                                                                      <SwapAndBridgeControllerStateProvider>
                                                                        <TransferControllerStateProvider>
                                                                          {/* Reading from controllers in components, rendered above ControllersStateLoadedProvider
                                                                    must be done very carefully, as it is not guaranteed that the state is loaded */}
                                                                          <ControllersStateLoadedProvider>
                                                                            <KeyboardProvider>
                                                                              <NetInfoProvider>
                                                                                <AuthProvider>
                                                                                  <OnboardingNavigationProvider>
                                                                                    <AppRouter />
                                                                                    <PortalHost name="global" />
                                                                                  </OnboardingNavigationProvider>
                                                                                </AuthProvider>
                                                                              </NetInfoProvider>
                                                                            </KeyboardProvider>
                                                                          </ControllersStateLoadedProvider>
                                                                        </TransferControllerStateProvider>
                                                                      </SwapAndBridgeControllerStateProvider>
                                                                    </AddressBookControllerStateProvider>
                                                                  </ContractNamesControllerStateProvider>
                                                                </DomainsControllerStateProvider>
                                                              </DappsControllerStateProvider>
                                                            </PhishingControllerStateProvider>
                                                          </EmailVaultControllerStateProvider>
                                                        </BannerControllerStateProvider>
                                                      </PortfolioControllerStateProvider>
                                                    </RequestsControllerStateProvider>
                                                  </ActivityControllerStateProvider>
                                                </SignMessageControllerStateProvider>
                                              </KeystoreControllerStateProvider>
                                            </AccountPickerControllerStateProvider>
                                          </InviteControllerStateProvider>
                                        </FeatureFlagsControllerStateProvider>
                                      </ExtensionUpdateControllerStateProvider>
                                    </AutoLockControllerStateProvider>
                                  </ProvidersControllerStateProvider>
                                </SelectedAccountControllerStateProvider>
                              </AccountsControllerStateProvider>
                            </NetworksControllerStateProvider>
                          </GestureHandler>
                        </ThemeProvider>
                      </WalletStateControllerProvider>
                    </UiControllerStateProvider>
                  </StorageControllerStateProvider>
                </MainControllerStateProvider>
              </BackgroundServiceProvider>
            </ErrorBoundary>
          </ToastProvider>
        </SafeAreaProvider>
      </PortalProvider>
    </Router>
  )
}

export default AppInit
