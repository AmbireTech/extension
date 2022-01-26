// So that the localization gets initialized at the beginning.
import '@config/localization'

import { StatusBar } from 'expo-status-bar'
import React from 'react'

import Router from '@config/Router'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { AuthProvider } from '@modules/auth/contexts/authContext'
import AttentionGrabberProvider from '@modules/common/components/AttentionGrabber'
import { AccountsProvider } from '@modules/common/contexts/accountsContext'
import { AccountsPasswordsProvider } from '@modules/common/contexts/accountsPasswordsContext'
import { AddressBookProvider } from '@modules/common/contexts/addressBookContext'
import { NetworkProvider } from '@modules/common/contexts/networkContext'
import { PasscodeProvider } from '@modules/common/contexts/passcodeContext'
import { PortfolioProvider } from '@modules/common/contexts/portfolioContext'
import { RequestsProvider } from '@modules/common/contexts/requestsContext'
import { ToastProvider } from '@modules/common/contexts/toastContext'

const App = () => {
  return (
    <>
      <StatusBar style="light" />
      <ToastProvider>
        <AuthProvider>
          <AccountsProvider>
            <NetworkProvider>
              <PortfolioProvider>
                <RequestsProvider>
                  <AddressBookProvider>
                    <PasscodeProvider>
                      <AccountsPasswordsProvider>
                        <PortalProvider>
                          <AttentionGrabberProvider>
                            <Router />
                          </AttentionGrabberProvider>
                          <PortalHost name="global" />
                        </PortalProvider>
                      </AccountsPasswordsProvider>
                    </PasscodeProvider>
                  </AddressBookProvider>
                </RequestsProvider>
              </PortfolioProvider>
            </NetworkProvider>
          </AccountsProvider>
        </AuthProvider>
      </ToastProvider>
    </>
  )
}

export default App
