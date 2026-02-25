// So that the localization gets initialized at the beginning.
import '@common/config/localization'

import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import AppInit from '@common/modules/app-init/screens/AppInit'
import flexboxStyles from '@common/styles/utils/flexbox'
import { isExtension } from '@web/constants/browserapi'

// eslint-disable-next-line no-console
SplashScreen.preventAutoHideAsync().catch(console.warn) // TODO: log a sentry error

const App = () => {
  const { theme } = useTheme()
  // Because this tree is only rendered for the extension we check if
  // the window is an extension window and if it is web (not android or ios)
  if (!isExtension && isWeb) return 'Extension build successful! You can now close this window.'

  return (
    <GestureHandlerRootView
      style={[flexboxStyles.flex1, { backgroundColor: theme.primaryBackground }]}
    >
      <StatusBar style="light" backgroundColor={theme.secondaryBackground as string} />

      <AppInit />
    </GestureHandlerRootView>
  )
}

export default App
