import React, { useEffect, useLayoutEffect } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Spinner from '@common/components/Spinner'
import Wrapper from '@common/components/Wrapper'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import spacings from '@common/styles/spacings'
import WebView from '@metamask/react-native-webview'

import styles from './styles'

const ProviderScreen = () => {
  const { params } = useRoute()
  const { name, uri } = params
  const { goBack, setOptions } = useNavigation()
  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (!uri) {
      goBack()
    }
  }, [uri, goBack])

  useLayoutEffect(() => {
    setOptions({
      headerTitle: name
    })
  }, [name, setOptions])

  return (
    <GradientBackgroundWrapper>
      <Wrapper hasBottomTabNav={false} style={spacings.ph0} contentContainerStyle={spacings.pb0}>
        <WebView
          originWhitelist={['*']}
          source={{ uri }}
          injectedJavaScriptForMainFrameOnly
          injectedJavaScriptBeforeContentLoadedForMainFrameOnly
          setSupportMultipleWindows
          javaScriptEnabled
          containerStyle={[styles.container, { paddingBottom: insets.bottom }]}
          style={styles.webview}
          bounces={false}
          setBuiltInZoomControls={false}
          overScrollMode="never" // prevents the Android bounce effect (blue shade when scroll to end)
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingWrapper}>
              <Spinner />
            </View>
          )}
        />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default ProviderScreen
