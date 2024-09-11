import usePrevious from 'ambire-common/src/hooks/usePrevious'
import { isNull } from 'lodash'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, View } from 'react-native'

import ErrorIcon from '@common/assets/svg/ErrorIcon'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Wrapper from '@common/components/Wrapper'
import useGnosis from '@common/hooks/useGnosis'
import useNavigation from '@common/hooks/useNavigation'
import { MOBILE_ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { delayPromise } from '@common/utils/promises'
import WebView, { WebViewNavigation } from '@metamask/react-native-webview'
import { useIsFocused } from '@react-navigation/native'

import styles from './styles'

// Not in env for easy OTA updates
const SWAP_URL = 'https://swap.ambire.com/v0.2.0/#/'

const INJECTED_JAVASCRIPT_BEFORE_CONTENT_LOADED = `(function() {
  window.addEventListener('message', (msg) => {
    window.ReactNativeWebView.postMessage(JSON.stringify(msg.data));
  });
})();

true;
`

// Scales the webview a little bit, in order for the content to fit
// based on all spacings in our app, and to prevent horizontal scroll.
const WEB_VIEW_SCALE = 1

// Disables zoom in and pinch on the WebView for iOS
// {@link https://stackoverflow.com/a/49121982/1333836}
const DISABLE_ZOOM = `
  const meta = document.createElement('meta');
  meta.setAttribute('content', 'width=device-width, initial-scale=${WEB_VIEW_SCALE}, maximum-scale=${WEB_VIEW_SCALE}, user-scalable=0');
  meta.setAttribute('name', 'viewport');
  document.head.appendChild(meta);
`

// Set a better matching the mobile UI text selection color
// {@link https://stackoverflow.com/a/311437/1333836}
const TEXT_SELECTION_COLOR = `
  document.styleSheets[0].insertRule('::selection { background-color: ${colors.hauntedDreams}; }', 0);
`

// Set a better matching the mobile UI tap highlighting color,
// a bit transparent so the elements below gets visible.
// {@link https://stackoverflow.com/a/8092444/1333836}
const HIGHLIGHT_COLOR = `
  document.styleSheets[0].insertRule('* { -webkit-tap-highlight-color: ${colors.vulcan}; }', 0);
`

const INJECTED_JAVASCRIPT = `
  ${DISABLE_ZOOM}
  ${TEXT_SELECTION_COLOR}
  ${HIGHLIGHT_COLOR}

  true;
`

const SwapScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const isFocused = useIsFocused()
  const { sushiSwapIframeRef, hash, handleIncomingMessage, eventsCount } = useGnosis()
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState<null | boolean>(null)
  const webviewHtml = `
    <!DOCTYPE html>
      <html>
        <head>
          <style type="text/css" media="screen">
            body, html { width: 100%; height: 100%; box-sizing: border-box; padding: 0 5px }
            * { padding: 0; margin: 0; }
            /* Fixes the annoying little vertical height scroll */
            iframe { width: 100%; height: 99%; border: none; }
          </style>
        </head>
        <body>
          <iframe id="uniswap" src="${SWAP_URL}" allow="autoplay; encrypted-media"></iframe>
        </body>
      </html>
    `

  const prevHash = usePrevious(hash)
  useEffect(() => {
    if (hash !== prevHash) {
      setLoading(true)
    }
  }, [prevHash, hash])

  useEffect(() => {
    if (loading) {
      // To ensure a proper transition/update of the webview url with the new hash
      setTimeout(() => {
        setLoading(false)
      }, 200)
    }
  }, [loading])

  const handleOnShouldStartLoadWithRequest = useCallback((navState: WebViewNavigation) => {
    if (navState.url !== 'about:blank' && navState.url !== SWAP_URL) {
      Linking.openURL(navState.url)

      // Prevent the WebView from navigating to the new URL
      return false
    }

    // Allow allowed URLs to be loaded in WebView
    return true
  }, [])

  // Checks if the connection to the swap webview is successful based on
  // the number of events received from the webview.
  useEffect(() => {
    if (eventsCount > 3) {
      setConnected(true)
      return
    }

    setConnected(null)
    const checkEventsCount = setTimeout(() => {
      setConnected(eventsCount > 3)
    }, 10000)

    // Cleanup the timeout when hash changes or the component unmounts
    return () => clearTimeout(checkEventsCount)
  }, [eventsCount, hash]) // Re-run the effect when `eventsCount` or `hash` changes

  return (
    <GradientBackgroundWrapper>
      <Wrapper hasBottomTabNav style={spacings.ph0} scrollEnabled={false}>
        {isNull(connected) ? (
          <View style={[styles.statusContainer, flexbox.center]}>
            <View style={[styles.statusContainerContent, flexbox.center]}>
              <Spinner />
              <Text weight="regular" fontSize={16} style={[text.center, spacings.mtLg]}>
                {t('Connecting...')}
              </Text>
            </View>
          </View>
        ) : connected ? null : (
          <View style={[styles.statusContainer, flexbox.center]}>
            <View
              style={[
                styles.statusContainerContent,
                flexbox.justifyCenter,
                spacings.ph,
                spacings.pvLg
              ]}
            >
              <View style={[flexbox.center, spacings.mbLg]}>
                <ErrorIcon color={colors.heliotrope} width={40} height={40} />
              </View>
              <Text fontSize={18} style={[text.center, spacings.ph, spacings.mbMd]}>
                {t('The device is not fully compatible')}
              </Text>
              <Text style={[text.center, spacings.ph, spacings.mbLg]}>
                {t(
                  "Your device doesn't fully support the integrated Swap feature at the moment. We're actively working to make more devices compatible. Meanwhile, please use UniSwap from our dApp catalog as an alternative."
                )}
              </Text>
              <Button
                type="outline"
                accentColor={colors.turquoise}
                text={t('Open UniSwap')}
                hasBottomSpacing={false}
                onPress={async () => {
                  // initially ${MOBILE_ROUTES.dappsCatalog}-screen accessible by the router because it is nested in MOBILE_ROUTES.dappsCatalog stack.
                  // if ${MOBILE_ROUTES.dappsCatalog}-screen not found default to MOBILE_ROUTES.dappsCatalog which will auto open the ${MOBILE_ROUTES.dappsCatalog}-screen
                  // once entered in MOBILE_ROUTES.dappsCatalog, ${MOBILE_ROUTES.dappsCatalog}-screen will be visible to the router for subsequent navigation
                  navigate(`${MOBILE_ROUTES.dappsCatalog}-screen`, {
                    state: { selectedDappId: 'uniswap' }
                  })
                  await delayPromise(400)
                  if (isFocused) {
                    navigate(MOBILE_ROUTES.dappsCatalog, { state: { selectedDappId: 'uniswap' } })
                  }
                }}
              />
            </View>
          </View>
        )}
        <WebView
          key={hash}
          ref={sushiSwapIframeRef}
          source={{ html: loading ? '' : webviewHtml }}
          javaScriptEnabled
          injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT_BEFORE_CONTENT_LOADED}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          containerStyle={styles.container}
          style={[styles.webview, !connected && { opacity: 0.2 }]}
          bounces={false}
          setBuiltInZoomControls={false}
          scalesPageToFit={false}
          startInLoadingState
          scrollEnabled
          nestedScrollEnabled
          cacheEnabled={false}
          onShouldStartLoadWithRequest={handleOnShouldStartLoadWithRequest}
          renderLoading={() => (
            <View style={styles.loadingWrapper}>
              <Spinner />
            </View>
          )}
          onMessage={(event) => {
            const msg = JSON.parse(event.nativeEvent.data)
            handleIncomingMessage(msg)
          }}
        />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default SwapScreen
