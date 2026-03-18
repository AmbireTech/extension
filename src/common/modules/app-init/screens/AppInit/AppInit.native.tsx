import React from 'react'
import { Button, Text, View } from 'react-native'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { restart, useStallionUpdate } from 'react-native-stallion'
import { NativeRouter } from 'react-router-native'

import { ControllerStoreProvider } from '@common/contexts/controllerStoreContext'
import { NetInfoProvider } from '@common/contexts/netInfoContext'
import { ThemeProvider } from '@common/contexts/themeContext'
import { ToastProvider } from '@common/contexts/toastContext'
import useFonts from '@common/hooks/useFonts'
import AppRouter from '@common/modules/app-init/components/AppRouter'
import GestureHandler from '@common/modules/app-init/screens/AppInit/GestureHandler'
import { AuthProvider } from '@common/modules/auth/contexts/authContext'
import { OnboardingNavigationProvider } from '@common/modules/auth/contexts/onboardingNavigationContext'
import { PortalHost, PortalProvider } from '@gorhom/portal'
import { ControllersMiddlewareProvider } from '@mobile/contexts/controllersMiddlewareContext'
import { ControllersStateLoadedProvider } from '@mobile/contexts/controllersStateLoadedContext'

const AppInit = () => {
  const { fontsLoaded } = useFonts()
  const { isRestartRequired, currentlyRunningBundle, newReleaseBundle } = useStallionUpdate()

  if (!fontsLoaded) return null

  return (
    <NativeRouter>
      <PortalProvider>
        <SafeAreaProvider>
          <ToastProvider>
            <ControllerStoreProvider withErrorToasts>
              <ControllersMiddlewareProvider>
                <ThemeProvider>
                  <GestureHandler>
                    <ControllersStateLoadedProvider>
                      <KeyboardProvider>
                        <NetInfoProvider>
                          <AuthProvider>
                            <OnboardingNavigationProvider>
                              <View
                                pointerEvents="none"
                                style={{
                                  position: 'absolute',
                                  top: 80,
                                  right: 8,
                                  zIndex: 9999,
                                  paddingHorizontal: 10,
                                  paddingVertical: 6,
                                  borderRadius: 10,
                                  backgroundColor: 'rgba(0,0,0,0.55)'
                                }}
                              >
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
                                  OTA test: v3
                                </Text>
                              </View>

                              <View
                                style={{
                                  position: 'absolute',
                                  top: 80,
                                  left: 8,
                                  zIndex: 9999,
                                  paddingHorizontal: 10,
                                  paddingVertical: 8,
                                  borderRadius: 10,
                                  backgroundColor: 'rgba(0,0,0,0.55)',
                                  maxWidth: 260
                                }}
                              >
                                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                                  Stallion debug
                                </Text>
                                <Text style={{ color: '#fff', fontSize: 11 }}>
                                  running: {currentlyRunningBundle?.id ?? 'n/a'}
                                </Text>
                                <Text style={{ color: '#fff', fontSize: 11 }}>
                                  new: {newReleaseBundle?.id ?? 'n/a'}
                                </Text>
                                <Text style={{ color: '#fff', fontSize: 11 }}>
                                  restartRequired: {String(isRestartRequired)}
                                </Text>
                                {isRestartRequired ? (
                                  <View style={{ marginTop: 6 }}>
                                    <Button title="Restart to apply OTA" onPress={restart} />
                                  </View>
                                ) : null}
                              </View>

                              <AppRouter />
                              <PortalHost name="global" />
                            </OnboardingNavigationProvider>
                          </AuthProvider>
                        </NetInfoProvider>
                      </KeyboardProvider>
                    </ControllersStateLoadedProvider>
                  </GestureHandler>
                </ThemeProvider>
              </ControllersMiddlewareProvider>
            </ControllerStoreProvider>
          </ToastProvider>
        </SafeAreaProvider>
      </PortalProvider>
    </NativeRouter>
  )
}

export default AppInit
