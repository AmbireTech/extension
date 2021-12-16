// So that the localization gets initialized at the beginning.
import '@config/localization'

import { StatusBar } from 'expo-status-bar'
import React from 'react'

import Router from '@config/Router'
import { AuthProvider } from '@modules/auth/contexts/authContext'
import { AccountsProvider } from '@modules/common/contexts/accountsContext'
import { NetworkProvider } from '@modules/common/contexts/networkContext/networkContext'

const App = () => {
  return (
    <>
      <StatusBar style="auto" />
      <AuthProvider>
        <AccountsProvider>
          <NetworkProvider>
            <Router />
          </NetworkProvider>
        </AccountsProvider>
      </AuthProvider>
    </>
  )
}

export default App
