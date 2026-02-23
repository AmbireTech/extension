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
  const { fontsLoaded } = useFonts()

  if (!fontsLoaded) return null

  return (
    <BrowserRouter>
      <PortalProvider>
        <GlobalTooltip />
        <SafeAreaProvider>
          <ControllerStoreProvider>
            <ControllersMiddlewareProvider>
              <ThemeProvider>
                <ToastProvider>
                  <BenzinNetworksContextProvider>
                    <BenzinScreen />
                    <PortalHost name="global" />
                  </BenzinNetworksContextProvider>
                </ToastProvider>
              </ThemeProvider>
            </ControllersMiddlewareProvider>
          </ControllerStoreProvider>
        </SafeAreaProvider>
      </PortalProvider>
    </BrowserRouter>
  )
}

export default BenzinInit
