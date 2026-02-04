import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrowserRouter } from 'react-router-dom'

import { GlobalTooltip } from '@common/components/GlobalTooltip'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { ContractNamesControllerStateProvider } from '@web/contexts/contractNamesControllerStateContext'
import { ControllersMiddlewareProvider } from '@web/contexts/controllersMiddlewareContext'
import { DomainsControllerStateProvider } from '@web/contexts/domainsControllerStateContext'
import { ProvidersControllerStateProvider } from '@web/contexts/providersControllerStateContext'

import { BenzinNetworksContextProvider } from './context'
import BenzinScreen from './screens/BenzinScreen'

const BenzinInit = () => {
  const { fontsLoaded, robotoFontsLoaded } = useFonts()

  if (!fontsLoaded && !robotoFontsLoaded) return null

  return (
    <BrowserRouter>
      <PortalProvider>
        <GlobalTooltip />
        <ThemeProvider>
          <SafeAreaProvider>
            <ToastProvider>
              <ControllersMiddlewareProvider env="explorer">
                <ProvidersControllerStateProvider>
                  <ContractNamesControllerStateProvider>
                    <BenzinNetworksContextProvider>
                      <DomainsControllerStateProvider>
                        <BenzinScreen />
                        <PortalHost name="global" />
                      </DomainsControllerStateProvider>
                    </BenzinNetworksContextProvider>
                  </ContractNamesControllerStateProvider>
                </ProvidersControllerStateProvider>
              </ControllersMiddlewareProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </PortalProvider>
    </BrowserRouter>
  )
}

export default BenzinInit
