import * as SplashScreen from 'expo-splash-screen'
import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'

import Text from '@common/components/Text'
import { LeanThemeProvider } from '@common/contexts/themeContext/context'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { DEFAULT_THEME } from '@common/styles/theme/types'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Props {
  devUrl: string
  isDevServerReachable: boolean
}

const WebviewDevServerErrorInner = ({ devUrl, isDevServerReachable }: Props) => {
  const { theme } = useTheme()

  // The native splash is still up at this point - the router hides it only once
  // the controllers are ready, which never happens while the worker cannot boot.
  // Without this the whole screen would sit invisible behind the splash.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {})
  }, [])

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        flexbox.center,
        spacings.ph,
        { backgroundColor: theme.primaryBackground, zIndex: 100, elevation: 100 }
      ]}
    >
      <Text fontSize={20} weight="semiBold" style={[spacings.mbSm, { textAlign: 'center' }]}>
        The webview worker cannot start
      </Text>
      <Text
        fontSize={14}
        appearance="secondaryText"
        style={[spacings.mbLg, { textAlign: 'center' }]}
      >
        The app cannot reach the webview dev server, so no controller can boot.
      </Text>
      <View
        style={[
          spacings.pvSm,
          spacings.phMd,
          spacings.mbLg,
          common.borderRadiusPrimary,
          { backgroundColor: theme.secondaryBackground }
        ]}
      >
        <Text fontSize={13} weight="mono_regular" selectable>
          yarn dev:webview
        </Text>
      </View>
      <Text
        fontSize={13}
        appearance="tertiaryText"
        style={[spacings.mbTy, { textAlign: 'center' }]}
      >
        {isDevServerReachable
          ? 'Dev server is up, waiting for the worker to boot...'
          : 'Run it in a second terminal and reload the app.'}
      </Text>
      <Text fontSize={12} appearance="tertiaryText" style={{ textAlign: 'center' }}>
        Expected at {devUrl}. On a physical device WEBVIEW_DEV_HOST in .env must be the LAN IP of
        the machine running the dev server.
      </Text>
    </View>
  )
}

/**
 * Full-screen notice shown in dev when the webview worker bundle cannot be
 * fetched. Rendered above the app's ThemeProvider, hence the lean one.
 */
const WebviewDevServerError = (props: Props) => (
  <LeanThemeProvider selectedThemeType={DEFAULT_THEME} updateThemeType={() => {}}>
    <WebviewDevServerErrorInner {...props} />
  </LeanThemeProvider>
)

export default React.memo(WebviewDevServerError)
