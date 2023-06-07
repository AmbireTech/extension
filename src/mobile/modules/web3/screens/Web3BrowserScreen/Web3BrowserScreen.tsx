import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, TouchableHighlight, View } from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'
import { WebView, WebViewNavigation } from 'react-native-webview'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Input from '@common/components/Input'
import Spinner from '@common/components/Spinner'
import Wrapper from '@common/components/Wrapper'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AntDesign } from '@expo/vector-icons'
import useWeb3 from '@mobile/modules/web3/hooks/useWeb3'
import useGetProviderInjection from '@mobile/modules/web3/services/webview-inpage/injection-script'

import styles from './styles'

const HIT_SLOP = { bottom: 15, left: 5, right: 5, top: 15 }

const Web3BrowserScreen = () => {
  const webViewRef = useRef<WebView | null>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [openedUrl, setOpenedUrl] = useState('')

  const { selectedDappUrl, setWeb3ViewRef, handleWeb3Request, setSelectedDapp } = useWeb3()
  const { script: providerToInject } = useGetProviderInjection()

  useEffect(() => {
    setWeb3ViewRef(webViewRef.current)
    return () => {
      setWeb3ViewRef(null)
      setSelectedDapp(null)
    }
  }, [setWeb3ViewRef, setSelectedDapp])

  const onMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)

      // Handle messages sent by the injected EthereumProvider
      handleWeb3Request({ data })
    } catch (error) {
      console.error(error)
    }
  }

  const onNavigationStateChange = useCallback((navState: WebViewNavigation) => {
    setCanGoBack(navState.canGoBack)
    setCanGoForward(navState.canGoForward)
    if (navState.url !== 'about:blank') {
      setOpenedUrl(navState.url)
    }
  }, [])

  if (!selectedDappUrl) {
    return (
      <GradientBackgroundWrapper>
        <View style={[StyleSheet.absoluteFill, flexbox.alignCenter, flexbox.justifyCenter]}>
          <Spinner />
        </View>
      </GradientBackgroundWrapper>
    )
  }

  return (
    <ErrorBoundary>
      <GradientBackgroundWrapper>
        <Wrapper style={spacings.ph0} hasBottomTabNav>
          <View
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.pbTy,
              spacings.prSm,
              spacings.plSm
            ]}
          >
            <TouchableHighlight
              hitSlop={HIT_SLOP}
              onPress={webViewRef.current?.goBack}
              style={[styles.webviewButtonCommon, styles.left]}
              disabled={!canGoBack}
              underlayColor={colors.heliotrope}
            >
              <AntDesign
                color={canGoBack ? colors.white : colors.titan_50}
                name="left"
                size={24}
                spot
              />
            </TouchableHighlight>
            <TouchableHighlight
              hitSlop={HIT_SLOP}
              onPress={webViewRef.current?.goForward}
              style={[styles.webviewButtonCommon, styles.right]}
              disabled={!canGoForward}
              underlayColor={colors.heliotrope}
            >
              <AntDesign
                color={canGoForward ? colors.white : colors.titan_50}
                name="right"
                size={24}
              />
            </TouchableHighlight>
            <Input
              containerStyle={[flexbox.flex1, spacings.mb0]}
              disabled
              inputStyle={styles.addressInputStyle}
              inputWrapperStyle={styles.addressInputWrapperStyle}
              value={openedUrl}
            />
            <TouchableHighlight
              hitSlop={HIT_SLOP}
              onPress={webViewRef.current?.reload}
              style={[styles.webviewButtonCommon, styles.reload]}
              underlayColor={colors.heliotrope}
            >
              <AntDesign name="reload1" size={22} color={colors.white} />
            </TouchableHighlight>
          </View>
          <WebView
            ref={webViewRef}
            source={providerToInject ? { uri: openedUrl || selectedDappUrl } : { html: '' }}
            onMessage={onMessage}
            injectedJavaScriptBeforeContentLoaded={providerToInject}
            onNavigationStateChange={onNavigationStateChange}
            // Prevents opening the Browser App when clicking on links in the webview,
            // example: https://uniswap.org/ clicking the Launch App button
            setSupportMultipleWindows={false}
            javaScriptEnabled
            startInLoadingState
            bounces={false}
            renderLoading={() => (
              <View style={styles.loadingWrapper}>
                <Spinner />
              </View>
            )}
            containerStyle={styles.container}
            style={styles.webview}
          />
        </Wrapper>
      </GradientBackgroundWrapper>
    </ErrorBoundary>
  )
}

export default Web3BrowserScreen
