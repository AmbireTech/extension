import Fuse from 'fuse.js'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { WebView, WebViewNavigation } from 'react-native-webview'
import { useLocation } from 'react-router-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import HomeIcon from '@common/assets/svg/HomeIcon'
import SearchIcon from '@common/assets/svg/SearchIcon'
import BottomSheet from '@common/components/BottomSheet'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import DappItem from '@common/modules/dapp-catalog/components/DappItem'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'

const securityPatches = `
  var _originalFetch = window.fetch;
  window.fetch = function() {
    var url = arguments[0];
    if (typeof url === 'string' && url.indexOf('file://') === 0) {
      return Promise.reject(new Error('fetch to file:// is blocked for security.'));
    }
    if (url && typeof url === 'object' && url.url && url.url.indexOf('file://') === 0) {
      return Promise.reject(new Error('fetch to file:// is blocked for security.'));
    }
    return _originalFetch.apply(this, arguments);
  };
  var _originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && url.indexOf('file://') === 0) {
      throw new Error('XHR to file:// is blocked for security.');
    }
    return _originalOpen.apply(this, arguments);
  };
  window.onerror = function(msg, url, lineNo, columnNo, error) {
    return false;
  };
`

const DappWebViewScreen = () => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const location = useLocation()
  const { goBack } = useNavigation()
  const { state: dappsState } = useController('DappsController')

  // Initial State from Route
  const initialUrl = (location.state as any)?.url || 'https://google.com'

  // WebView Refs & State
  const webviewRef = useRef<WebView>(null)
  const [dappUrl, setDappUrl] = useState<string>(initialUrl)
  const [trustedUrl, setTrustedUrl] = useState<string>(initialUrl)

  // Bottom Sheet & Search Form State
  const { ref: searchModalRef, open: openSearchModal, close: closeSearchModal } = useModalize()
  const { control: headerControl, setValue: setHeaderValue } = useForm({
    defaultValues: { search: initialUrl }
  })
  const {
    control: searchControl,
    watch: searchWatch,
    setValue: setSearchValue
  } = useForm({ defaultValues: { search: '' } })
  const bottomSheetSearchQuery = searchWatch('search')
  const debouncedSearch = useDebounce({ value: bottomSheetSearchQuery, delay: 350 })

  const handleOpenSearchModal = useCallback(() => {
    setSearchValue('search', trustedUrl)
    openSearchModal()
  }, [openSearchModal, setSearchValue, trustedUrl])

  const hostname = useMemo(() => {
    try {
      return new URL(trustedUrl).hostname
    } catch {
      return trustedUrl
    }
  }, [trustedUrl])

  // Keep the Header placeholder in sync with current trusted URL
  useEffect(() => {
    setHeaderValue('search', hostname)
  }, [hostname, setHeaderValue])

  // Custom Header Animation
  const [bindAnim, animStyle] = useCustomHover({
    property: 'opacity',
    values: { from: 1, to: 0.7 }
  })

  const handleNavigationStateChange = useCallback((e: WebViewNavigation) => {
    if (!e.loading) {
      setTrustedUrl(e.url)
    }
  }, [])

  // Dapp Search Data Filtering
  const searchableDapps = useMemo(
    () =>
      dappsState.dapps.map((dapp: Dapp) => ({
        dapp,
        name: dapp.name.toLowerCase(),
        url: dapp.url.toLowerCase(),
        description: dapp.description?.toLowerCase() || ''
      })),
    [dappsState.dapps]
  )

  const searchResults = useMemo(() => {
    if (!debouncedSearch) return []
    const fuse = new Fuse(searchableDapps, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'url', weight: 0.2 },
        { name: 'description', weight: 0.1 }
      ],
      shouldSort: false,
      threshold: 0.2, // matching DappCatalogScreen logic
      minMatchCharLength: 1
    })
    const results = fuse.search(debouncedSearch)
    return results.map((result) => result.item.dapp)
  }, [debouncedSearch, searchableDapps])

  const isValidUrl = (urlString: string) => {
    try {
      return Boolean(new URL(urlString))
    } catch {
      return false
    }
  }

  // Data to render in bottom sheet list
  const listData = useMemo(() => {
    const data: any[] = []
    if (debouncedSearch) {
      if (isValidUrl(debouncedSearch)) {
        data.push({ type: 'openPage', query: debouncedSearch })
      }
      data.push({ type: 'googleSearch', query: debouncedSearch })
    } else {
      const suggestedDapps = dappsState.dapps.filter(
        (dapp: Dapp) => dapp.favorite || dapp.isConnected
      )
      const emptySearchFallback = suggestedDapps.length > 0 ? suggestedDapps : dappsState.dapps
      data.push(...emptySearchFallback.map((dapp: Dapp) => ({ type: 'dapp', dapp })))
    }
    data.push(...searchResults.map((dapp: Dapp) => ({ type: 'dapp', dapp })))
    return data
  }, [debouncedSearch, searchResults, dappsState.dapps])

  const handleNavigateToUrl = useCallback(
    (url: string) => {
      setDappUrl(url)
      closeSearchModal()
    },
    [closeSearchModal]
  )

  const renderSearchItem = useCallback(
    ({ item }: { item: any }) => {
      if (item.type === 'openPage') {
        return (
          <AnimatedPressable
            onPress={() => handleNavigateToUrl(item.query)}
            style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb]}
          >
            <View
              style={[
                spacings.mrSm,
                { backgroundColor: theme.secondaryBackground, borderRadius: 20, padding: 8 }
              ]}
            >
              <SearchIcon color={theme.iconPrimary} width={20} height={20} />
            </View>
            <Text weight="medium" appearance="secondaryText">
              Open {item.query}
            </Text>
          </AnimatedPressable>
        )
      }

      if (item.type === 'googleSearch') {
        return (
          <AnimatedPressable
            onPress={() =>
              handleNavigateToUrl(
                `https://www.google.com/search?q=${encodeURIComponent(item.query)}`
              )
            }
            style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb]}
          >
            <View
              style={[
                spacings.mrSm,
                { backgroundColor: theme.secondaryBackground, borderRadius: 20, padding: 8 }
              ]}
            >
              <SearchIcon color={theme.iconPrimary} width={20} height={20} />
            </View>
            <Text weight="medium" appearance="secondaryText">
              Search Google for "{item.query}"
            </Text>
          </AnimatedPressable>
        )
      }

      if (item.type === 'dapp') {
        return (
          <DappItem {...item.dapp} onPressOverride={() => handleNavigateToUrl(item.dapp.url)} />
        )
      }
      return null
    },
    [theme, handleNavigateToUrl]
  )

  return (
    <MobileLayoutContainer
      footer={
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            spacings.phSm,
            spacings.ptSm,
            spacings.pbTy
          ]}
        >
          <Pressable
            onPress={goBack}
            style={[
              flexbox.alignCenter,
              flexbox.justifyCenter,
              {
                backgroundColor: theme.secondaryBackground,
                borderRadius: 50,
                width: 40,
                height: 40
              }
            ]}
          >
            <HomeIcon />
          </Pressable>
          <AnimatedPressable
            style={[
              flexbox.flex1,
              spacings.mlSm,
              { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_PRIMARY },
              animStyle
            ]}
            onPress={handleOpenSearchModal as any}
            {...bindAnim}
          >
            <View pointerEvents="none">
              <Search
                control={headerControl as any}
                hasLeftIcon={false}
                inputWrapperStyle={{
                  backgroundColor: 'transparent'
                }}
                withClearButton={false}
                editable={false}
              />
            </View>
          </AnimatedPressable>
        </View>
      }
    >
      <View style={flexbox.flex1}>
        <WebView
          ref={webviewRef}
          source={{ uri: dappUrl }}
          onNavigationStateChange={handleNavigationStateChange}
          injectedJavaScriptBeforeContentLoaded={securityPatches}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          originWhitelist={['https://*', 'http://*']}
        />
      </View>

      <BottomSheet
        id="dapp-webview-search"
        sheetRef={searchModalRef}
        adjustToContentHeight={false}
        closeBottomSheet={closeSearchModal}
        HeaderComponent={
          <View style={[spacings.mbLg]}>
            <Search
              control={searchControl}
              placeholder={t('Search or enter URL')}
              autoFocus={true}
            />
          </View>
        }
      >
        <ScrollableWrapper
          type={WRAPPER_TYPES.FLAT_LIST}
          data={listData}
          renderItem={renderSearchItem}
          keyExtractor={(item: any, index: number) =>
            item.type === 'dapp' ? item.dapp.url : `google-${index}`
          }
          contentContainerStyle={[spacings.pbLg]}
          keyboardShouldPersistTaps="handled"
        />
      </BottomSheet>
    </MobileLayoutContainer>
  )
}

export default DappWebViewScreen
