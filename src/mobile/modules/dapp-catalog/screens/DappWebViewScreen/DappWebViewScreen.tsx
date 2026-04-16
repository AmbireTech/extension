import Fuse from 'fuse.js'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { WebView, WebViewNavigation } from 'react-native-webview'
import { useLocation } from 'react-router-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import GlobeIcon from '@common/assets/svg/GlobeIcon'
import GoogleIcon from '@common/assets/svg/GoogleIcon'
import HomeIcon from '@common/assets/svg/HomeIcon'
import Avatar from '@common/components/Avatar'
import BottomSheet from '@common/components/BottomSheet'
import NetworkIcon from '@common/components/NetworkIcon'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import NotConnected from '@common/modules/dapp-catalog/components/DappIcon/NotConnected'
import DappItem from '@common/modules/dapp-catalog/components/DappItem'
import { ROUTES } from '@common/modules/router/constants/common'
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
  const { navigate } = useNavigation()
  const {
    state: { dapps },
    currentDapp,
    dappUrl,
    setDappUrl
  } = useController('DappsController')

  console.log('currentDapp', currentDapp)

  // Initial State from Route
  const initialUrl = (location.state as any)?.url || 'https://google.com'

  // WebView Refs & State
  const webviewRef = useRef<WebView>(null)
  const [trustedUrl, setTrustedUrl] = useState<string>(initialUrl)

  useEffect(() => {
    if (!dappUrl && setDappUrl) setDappUrl(initialUrl)
  }, [dappUrl, initialUrl, setDappUrl])

  const activeDappUrl = dappUrl || initialUrl

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
  const { account } = useController('SelectedAccountController').state

  const smartAccountType = useMemo(() => {
    if (account?.creation) return 'Ambire'
    if (account?.safeCreation) return 'Safe'
    return undefined
  }, [account])

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
      dapps.map((dapp: Dapp) => ({
        dapp,
        name: dapp.name.toLowerCase(),
        url: dapp.url.toLowerCase(),
        description: dapp.description?.toLowerCase() || ''
      })),
    [dapps]
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
      data.push({ type: 'googleSearch', query: debouncedSearch })
      if (isValidUrl(debouncedSearch)) {
        data.push({ type: 'openPage', query: debouncedSearch })
      }
    } else {
      const suggestedDapps = dapps.filter((dapp: Dapp) => dapp.favorite || dapp.isConnected)
      const emptySearchFallback = suggestedDapps.length > 0 ? suggestedDapps : dapps
      data.push(...emptySearchFallback.map((dapp: Dapp) => ({ type: 'dapp', dapp })))
    }
    data.push(...searchResults.map((dapp: Dapp) => ({ type: 'dapp', dapp })))
    return data
  }, [debouncedSearch, searchResults, dapps])

  const handleNavigateToUrl = useCallback(
    (url: string) => {
      setDappUrl?.(url)
      closeSearchModal()
    },
    [closeSearchModal, setDappUrl]
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
                flexbox.center,
                {
                  backgroundColor: theme.secondaryBackground,
                  borderRadius: 50,
                  width: 40,
                  height: 40
                }
              ]}
            >
              <GlobeIcon />
            </View>
            <Text weight="medium" appearance="secondaryText">
              Open "{item.query}"
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
                flexbox.center,
                {
                  backgroundColor: theme.secondaryBackground,
                  borderRadius: 50,
                  width: 40,
                  height: 40
                }
              ]}
            >
              <GoogleIcon />
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
            onPress={() => navigate(ROUTES.apps)}
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
              spacings.mhSm,
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
          {!!account && (
            <View>
              {!!currentDapp && (
                <>
                  <View
                    style={{
                      minWidth: 8,
                      minHeight: 8,
                      borderRadius: 10,
                      backgroundColor:
                        currentDapp.blacklisted === 'BLACKLISTED'
                          ? theme.errorDecorative
                          : theme.successDecorative,
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      zIndex: 2,
                      borderWidth: 1,
                      borderColor:
                        currentDapp.blacklisted === 'BLACKLISTED'
                          ? theme.errorBackground
                          : theme.primaryBackground
                    }}
                  >
                    {!currentDapp.isConnected && (
                      <NotConnected
                        style={{
                          minWidth: 8,
                          minHeight: 8
                        }}
                        isBlacklisted={currentDapp.blacklisted === 'BLACKLISTED'}
                      />
                    )}
                  </View>

                  {currentDapp.isConnected && (
                    <View
                      style={{
                        position: 'absolute',
                        left: -2,
                        bottom: -2,
                        zIndex: 2
                      }}
                    >
                      <NetworkIcon id={currentDapp.chainId.toString()} size={12} scale={0.8} />
                    </View>
                  )}
                </>
              )}

              <Avatar
                pfp={account.preferences.pfp}
                address={account.addr}
                size={40}
                style={spacings.pr0}
                smartAccountType={smartAccountType}
              />
            </View>
          )}
        </View>
      }
    >
      <View style={flexbox.flex1}>
        <WebView
          ref={webviewRef}
          source={{ uri: activeDappUrl }}
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
          <Search
            control={searchControl}
            placeholder={t('Search or enter URL')}
            autoFocus={true}
            containerStyle={spacings.mbLg}
          />
        }
        flatListProps={{
          contentContainerStyle: spacings.pbLg,
          data: listData,
          renderItem: renderSearchItem,
          keyExtractor: (item: any, index: number) =>
            item.type === 'dapp' ? item.dapp.url : `google-${index}`,
          keyboardShouldPersistTaps: 'handled'
        }}
      />
    </MobileLayoutContainer>
  )
}

export default DappWebViewScreen
