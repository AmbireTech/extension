// So that the localization gets initialized at the beginning.
import '@config/localization'

import { StatusBar } from 'expo-status-bar'
import React from 'react'

import Router from '@config/Router'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { AuthProvider } from '@modules/auth/contexts/authContext'
import AttentionGrabberProvider from '@modules/common/components/AttentionGrabber'
import { AccountsProvider } from '@modules/common/contexts/accountsContext'
import { AddressBookProvider } from '@modules/common/contexts/addressBookContext'
import { NetworkProvider } from '@modules/common/contexts/networkContext'
import { PortfolioProvider } from '@modules/common/contexts/portfolioContext'
import { RequestsProvider } from '@modules/common/contexts/requestsContext'
import { ToastProvider } from '@modules/common/contexts/toastContext'

const App = () => {
  return (
    <>
      <StatusBar style="light" />
      <AuthProvider>
        <AccountsProvider>
          <NetworkProvider>
            <PortfolioProvider>
              <RequestsProvider>
                <AddressBookProvider>
                  <PortalProvider>
                    <ToastProvider>
                      <AttentionGrabberProvider>
                        <Router />
                      </AttentionGrabberProvider>
                    </ToastProvider>
                    <PortalHost name="global" />
                  </PortalProvider>
                </AddressBookProvider>
              </RequestsProvider>
            </PortfolioProvider>
          </NetworkProvider>
        </AccountsProvider>
      </AuthProvider>
    </>
  )
}

export default App
