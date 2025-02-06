// So that the localization gets initialized at the beginning.
import '@common/config/localization'

import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { ExtensionWalletProvider } from '@common/contexts/extensionWalletContext'
import AppInit from '@common/modules/app-init/screens/AppInit'
import colors from '@common/styles/colors'
import flexboxStyles from '@common/styles/utils/flexbox'
import * as Sentry from '@sentry/react-native'

SplashScreen.preventAutoHideAsync().catch(console.warn) // TODO: log a sentry error

const App = () => {
  return (
    <GestureHandlerRootView
      style={[flexboxStyles.flex1, { backgroundColor: colors.hauntedDreams }]}
    >
      <StatusBar style="light" backgroundColor={colors.wooed} />

      <ExtensionWalletProvider>
        <AppInit />
      </ExtensionWalletProvider>
    </GestureHandlerRootView>
  )
}

export default Sentry.wrap(App);
