import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import ErrorBoundary from 'react-native-error-boundary'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Spinner from '@common/components/Spinner'
import Wrapper from '@common/components/Wrapper'
import useNavigation from '@common/hooks/useNavigation'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { WebView, WebViewNavigation } from '@metamask/react-native-webview'
import BrowserNavigationToolbar from '@mobile/modules/web3/components/BrowserNavigationToolbar'
import useWeb3 from '@mobile/modules/web3/hooks/useWeb3'
import useGetProviderInjection from '@mobile/modules/web3/services/webview-inpage/injection-script'

import styles from './styles'

const Web3BrowserScreen = () => {
  const { t } = useTranslation()
  const { goBack } = useNavigation()
  const webViewRef = useRef<WebView | null>(null)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [openedUrl, setOpenedUrl] = useState('')
  // Keeps track of what the user is currently typing in the address bar
  const [addressBarValue, setAddressBarValue] = useState('')

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

  const onNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      setCanGoBack(navState.canGoBack)
      setCanGoForward(navState.canGoForward)

      if (navState.url !== 'about:blank' && navState.url !== openedUrl) {
        setAddressBarValue(navState.url)
      }
    },
    [openedUrl]
  )

  const handleInputSubmit = useCallback(() => setOpenedUrl(addressBarValue), [addressBarValue])

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
          <BrowserNavigationToolbar
            canGoHome
            canReload
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoHome={goBack}
            onGoBack={webViewRef.current?.goBack}
            onGoForward={webViewRef.current?.goForward}
            onReload={webViewRef.current?.reload}
            addressBarValue={addressBarValue}
            addressBarPlaceholder={t('Type URL')}
            onChangeAddressBarValue={setAddressBarValue}
            onSubmitEditingAddressBar={handleInputSubmit}
          />
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
