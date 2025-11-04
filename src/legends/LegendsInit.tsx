import React from 'react'

import { PortalHost, PortalProvider } from '@gorhom/portal'
import * as Sentry from '@sentry/react'
import { EthereumProvider } from '@web/extension-services/inpage/EthereumProvider'

import ErrorPage from './components/ErrorPage'
import { AccountContextProvider } from './contexts/accountContext'
import { CharacterContextProvider } from './contexts/characterContext'
import { ProviderContextProvider } from './contexts/providerContext'
import { ToastContextProvider } from './contexts/toastsContext'
import Router from './modules/router/Router'

declare global {
  interface Window {
    ambire: EthereumProvider
  }
}

const errorComponent = <ErrorPage />

const LegendsInit = () => {
  return (
    <Sentry.ErrorBoundary fallback={errorComponent}>
      <PortalProvider>
        <ToastContextProvider>
          <ProviderContextProvider>
            <AccountContextProvider>
              <CharacterContextProvider>
                <Router />
              </CharacterContextProvider>
            </AccountContextProvider>
          </ProviderContextProvider>
        </ToastContextProvider>
        <PortalHost name="global" />
      </PortalProvider>
    </Sentry.ErrorBoundary>
  )
}

export default LegendsInit
