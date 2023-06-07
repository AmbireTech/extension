import usePrevious from 'ambire-common/src/hooks/usePrevious'
import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import WebView from 'react-native-webview'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Spinner from '@common/components/Spinner'
import Wrapper from '@common/components/Wrapper'
import useGnosis from '@common/hooks/useGnosis'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'

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
  const { sushiSwapIframeRef, hash, handleIncomingMessage } = useGnosis()
  const [loading, setLoading] = useState(false)
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

  return (
    <GradientBackgroundWrapper>
      <Wrapper hasBottomTabNav style={spacings.ph0} scrollEnabled={false}>
        {/* Note: might not work properly on Android emulator with this URL. */}
        <WebView
          key={hash}
          ref={sushiSwapIframeRef}
          source={{ html: loading ? '' : webviewHtml }}
          javaScriptEnabled
          injectedJavaScriptBeforeContentLoaded={INJECTED_JAVASCRIPT_BEFORE_CONTENT_LOADED}
          injectedJavaScript={INJECTED_JAVASCRIPT}
          containerStyle={styles.container}
          style={styles.webview}
          bounces={false}
          setBuiltInZoomControls={false}
          startInLoadingState
          scrollEnabled
          nestedScrollEnabled
          cacheEnabled={false}
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
