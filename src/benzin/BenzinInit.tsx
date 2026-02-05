import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrowserRouter } from 'react-router-dom'

import { GlobalTooltip } from '@common/components/GlobalTooltip'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { ControllersMiddlewareProvider } from '@web/contexts/controllersMiddlewareContext'

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
                <BenzinNetworksContextProvider>
                  <BenzinScreen />
                  <PortalHost name="global" />
                </BenzinNetworksContextProvider>
              </ControllersMiddlewareProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </PortalProvider>
    </BrowserRouter>
  )
}

export default BenzinInit
