import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrowserRouter } from 'react-router-dom'

import { GlobalTooltip } from '@common/components/GlobalTooltip'
import { ContractNamesContextProvider } from '@common/contexts/contractNamesContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { DomainsControllerStateProvider } from '@web/contexts/domainsControllerStateContext'

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
              <DomainsControllerStateProvider>
                <ContractNamesContextProvider>
                  <BenzinNetworksContextProvider>
                    <BenzinScreen />
                    <PortalHost name="global" />
                  </BenzinNetworksContextProvider>
                </ContractNamesContextProvider>
              </DomainsControllerStateProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </PortalProvider>
    </BrowserRouter>
  )
}

export default BenzinInit
