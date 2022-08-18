import React, { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import Router from '@config/Router'
import { hasMigratedFromAsyncStorage, migrateFromAsyncStorage } from '@config/storage'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { AuthProvider } from '@modules/auth/contexts/authContext'
import AttentionGrabberProvider from '@modules/common/components/AttentionGrabber'
import { AccountsProvider } from '@modules/common/contexts/accountsContext'
import { AccountsPasswordsProvider } from '@modules/common/contexts/accountsPasswordsContext'
import { AddressBookProvider } from '@modules/common/contexts/addressBookContext'
import { GasTankProvider } from '@modules/common/contexts/gasTankContext'
import { GnosisProvider } from '@modules/common/contexts/gnosisContext'
import { HeaderBottomSheetProvider } from '@modules/common/contexts/headerBottomSheetContext'
import { KeyboardProvider } from '@modules/common/contexts/keyboardContext'
import { LinkingProvider } from '@modules/common/contexts/linkingContext'
import { LoaderProvider } from '@modules/common/contexts/loaderContext'
import { NetInfoProvider } from '@modules/common/contexts/netInfoContext'
import { NetworkProvider } from '@modules/common/contexts/networkContext'
import { PasscodeProvider } from '@modules/common/contexts/passcodeContext'
import { PortfolioProvider } from '@modules/common/contexts/portfolioContext'
import { PrivateModeProvider } from '@modules/common/contexts/privateModeContext'
import { RequestsProvider } from '@modules/common/contexts/requestsContext'
import { ThemeProvider } from '@modules/common/contexts/themeContext'
import { ToastProvider } from '@modules/common/contexts/toastContext'
import { UnsupportedDAppsBottomSheetProvider } from '@modules/common/contexts/unsupportedDAppsBottomSheetContext'
import { WalletConnectProvider } from '@modules/common/contexts/walletConnectContext'
import useFonts from '@modules/common/hooks/useFonts'

const AppLoading = () => {
  // TODO: Remove `hasMigratedFromAsyncStorage` after a while (when everyone has migrated)
  const [hasMigrated, setHasMigrated] = useState(hasMigratedFromAsyncStorage)
  const { fontsLoaded } = useFonts()

  useEffect(() => {
    ;(async () => {
      if (!hasMigratedFromAsyncStorage) {
        try {
          await migrateFromAsyncStorage()
          setHasMigrated(true)
        } catch (e) {
          throw new Error('AsyncStorage migration failed!')
        }
      }
    })()
  }, [])

  if (!fontsLoaded || !hasMigrated) return null

  return (
    <PortalProvider>
      <LoaderProvider>
        <ThemeProvider>
          <SafeAreaProvider>
            <KeyboardProvider>
              <NetInfoProvider>
                <ToastProvider>
                  <AuthProvider>
                    <AccountsProvider>
                      <NetworkProvider>
                        <PortfolioProvider>
                          <GnosisProvider>
                            <WalletConnectProvider>
                              <RequestsProvider>
                                <AddressBookProvider>
                                  <AccountsPasswordsProvider>
                                    <PasscodeProvider>
                                      <AttentionGrabberProvider>
                                        <PrivateModeProvider>
                                          <GasTankProvider>
                                            <UnsupportedDAppsBottomSheetProvider>
                                              <HeaderBottomSheetProvider>
                                                <LinkingProvider>
                                                  <Router />
                                                </LinkingProvider>
                                              </HeaderBottomSheetProvider>
                                            </UnsupportedDAppsBottomSheetProvider>
                                          </GasTankProvider>
                                        </PrivateModeProvider>
                                      </AttentionGrabberProvider>
                                      <PortalHost name="global" />
                                    </PasscodeProvider>
                                  </AccountsPasswordsProvider>
                                </AddressBookProvider>
                              </RequestsProvider>
                            </WalletConnectProvider>
                          </GnosisProvider>
                        </PortfolioProvider>
                      </NetworkProvider>
                    </AccountsProvider>
                  </AuthProvider>
                </ToastProvider>
              </NetInfoProvider>
            </KeyboardProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </LoaderProvider>
    </PortalProvider>
  )
}

export default AppLoading
