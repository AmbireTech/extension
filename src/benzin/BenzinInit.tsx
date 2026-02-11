import React from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BrowserRouter } from 'react-router-dom'

import { BenzinNetworksContextProvider } from '@benzin/contexts/benzinNetworksContext'
import { ControllersMiddlewareProvider } from '@benzin/contexts/controllersMiddlewareContext'
import BenzinScreen from '@benzin/screens/BenzinScreen'
import { GlobalTooltip } from '@common/components/GlobalTooltip'
import { ControllerStoreProvider } from '@common/contexts/controllerStoreContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import { PortalHost, PortalProvider } from '@gorhom/portal'

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
              <ControllerStoreProvider>
                <ControllersMiddlewareProvider>
                  <BenzinNetworksContextProvider>
                    <BenzinScreen />
                    <PortalHost name="global" />
                  </BenzinNetworksContextProvider>
                </ControllersMiddlewareProvider>
              </ControllerStoreProvider>
            </ToastProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </PortalProvider>
    </BrowserRouter>
  )
}

export default BenzinInit
