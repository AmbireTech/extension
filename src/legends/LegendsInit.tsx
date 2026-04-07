import React from 'react'
import { HashRouter } from 'react-router-dom'

import { ControllerStoreProvider } from '@common/contexts/controllerStoreContext'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { ControllersMiddlewareProvider } from '@legends/contexts/controllersMiddlewareContext'
import * as Sentry from '@sentry/react'
import { EthereumProvider } from '@web/extension-services/inpage/EthereumProvider'

import ErrorPage from './components/ErrorPage'
import { AccountContextProvider } from './contexts/accountContext'
import { ProviderContextProvider } from './contexts/providerContext'
import { ToastContextProvider } from './contexts/toastsContext'
import Router from './modules/router/Router'

declare global {
  interface Window {
    ambire: EthereumProvider
  }
}

const errorComponent = <ErrorPage />

const SentryRouter = Sentry.withSentryReactRouterV6Routing(HashRouter)

const LegendsInit = () => {
  return (
    <Sentry.ErrorBoundary fallback={errorComponent}>
      <SentryRouter>
        <PortalProvider>
          <ToastContextProvider>
            <ControllerStoreProvider>
              <ControllersMiddlewareProvider>
                <ProviderContextProvider>
                  <AccountContextProvider>
                    <Router />
                  </AccountContextProvider>
                </ProviderContextProvider>
              </ControllersMiddlewareProvider>
            </ControllerStoreProvider>
          </ToastContextProvider>
          <PortalHost name="global" />
        </PortalProvider>
      </SentryRouter>
    </Sentry.ErrorBoundary>
  )
}

export default LegendsInit
