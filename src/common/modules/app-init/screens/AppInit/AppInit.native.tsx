import { Asset } from 'expo-asset'
import * as Font from 'expo-font'
import { Poppins_400Regular } from '@expo-google-fonts/poppins'
import React, { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NativeRouter } from 'react-router-native'

import { GlobalTooltip } from '@common/components/GlobalTooltip'
import { BiometricsProvider } from '@common/contexts/biometricsContext'
import { ControllerStoreProvider } from '@common/contexts/controllerStoreContext'
import { NetInfoProvider } from '@common/contexts/netInfoContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import AppRouter from '@common/modules/app-init/components/AppRouter'
import GestureHandler from '@common/modules/app-init/screens/AppInit/GestureHandler'
import { AuthProvider } from '@common/modules/auth/contexts/authContext'
import { OnboardingNavigationProvider } from '@common/modules/auth/contexts/onboardingNavigationContext'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { ControllersMiddlewareProvider } from '@mobile/contexts/controllersMiddlewareContext'
import { ControllersStateLoadedProvider } from '@mobile/contexts/controllersStateLoadedContext'
import { WalletConnectProvider } from '@mobile/modules/wallet-connect/contexts/walletConnectContext'

// TEMP FONT DIAGNOSTIC — remove after we pinpoint the OTA-restart tofu.
// Uses the SYSTEM font (raw <Text> from react-native, no fontFamily) so it stays readable even
// when the custom fonts render as tofu. Read these on-screen AFTER a Stallion OTA restart():
//   isLoaded      — expo-font's view of whether the family is registered
//   reloadAttempt — result of explicitly (re)loading the font right now: "OK ..." or "ERR: ..."
//   uri/localUri  — where the font asset resolves, and whether it materialized to a local file
const FontDiag = () => {
  const [reloadAttempt, setReloadAttempt] = useState('pending')
  const isLoaded = Font.isLoaded('Poppins_400Regular')
  const asset = Asset.fromModule(Poppins_400Regular)

  useEffect(() => {
    const a = Asset.fromModule(Poppins_400Regular)
    a
      .downloadAsync()
      .then(() => Font.loadAsync({ Poppins_400Regular }))
      .then(() => setReloadAttempt(`OK localUri=${a.localUri}`))
      .catch((e) => setReloadAttempt(`ERR: ${e?.message ?? String(e)}`))
  }, [])

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 90,
        left: 6,
        right: 6,
        zIndex: 99999,
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 8,
        borderRadius: 8
      }}
    >
      <Text style={{ color: '#fff', fontSize: 11 }}>[FONT DIAG] isLoaded={String(isLoaded)}</Text>
      <Text style={{ color: '#fff', fontSize: 11 }}>reloadAttempt={reloadAttempt}</Text>
      <Text style={{ color: '#fff', fontSize: 11 }}>uri={String(asset.uri)}</Text>
      <Text style={{ color: '#fff', fontSize: 11 }}>localUri={String(asset.localUri)}</Text>
    </View>
  )
}

const AppInit = () => {
  return (
    <NativeRouter>
      <PortalProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <ControllerStoreProvider withErrorToasts>
              <ControllersMiddlewareProvider>
                <WalletConnectProvider>
                  <ThemeProvider>
                    <GestureHandler>
                      <ControllersStateLoadedProvider>
                        <GlobalTooltip />
                        <KeyboardProvider>
                          <NetInfoProvider>
                            <AuthProvider>
                              <BiometricsProvider>
                                <OnboardingNavigationProvider>
                                  <FontDiag />
                                  <AppRouter />
                                  <PortalHost name="global" />
                                </OnboardingNavigationProvider>
                              </BiometricsProvider>
                            </AuthProvider>
                          </NetInfoProvider>
                        </KeyboardProvider>
                      </ControllersStateLoadedProvider>
                    </GestureHandler>
                  </ThemeProvider>
                </WalletConnectProvider>
              </ControllersMiddlewareProvider>
            </ControllerStoreProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </PortalProvider>
    </NativeRouter>
  )
}

export default AppInit
