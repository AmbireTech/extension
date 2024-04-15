import { TFunction } from 'i18next'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { View, ViewStyle } from 'react-native'

import { Banner } from '@ambire-common/interfaces/banner'
import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { AccountPortfolio } from '@web/contexts/portfolioControllerStateContext'
import commonWebStyles from '@web/styles/utils/common'
import { getUiType } from '@web/utils/uiType'

import useBanners from '../../hooks/useBanners'
import Collections from '../Collections'
import DashboardBanner from '../DashboardBanner'
import Tabs from '../Tabs'
import { TabType } from '../Tabs/Tab/Tab'
import Tokens from '../Tokens'

interface Props {
  accountPortfolio: AccountPortfolio | null
  filterByNetworkId: any
  tokenPreferences: CustomToken[]
  onScroll: (offset: number) => void
}

// We do this instead of unmounting the component to prevent component rerendering when switching tabs.
const HIDDEN_STYLE: ViewStyle = { position: 'absolute', opacity: 0, display: 'none' }

const { isPopup } = getUiType()

const getSearchPlaceholder = (openTab: TabType, t: TFunction) => {
  if (isPopup) {
    return t('Search')
  }

  return openTab === 'tokens' ? t('Search for tokens') : t('Search for NFTs')
}

const DashboardSectionList = ({
  accountPortfolio,
  filterByNetworkId,
  tokenPreferences,
  onScroll
}: Props) => {
  const { theme } = useTheme()
  const route = useRoute()
  const { t } = useTranslation()

  const [openTab, setOpenTab] = useState(() => {
    const params = new URLSearchParams(route?.search)

    return (params.get('tab') as TabType) || 'tokens'
  })
  const prevOpenTab = usePrevious(openTab)
  // To prevent initial load of all tabs but load them when requested by the user
  // Persist the rendered list of items for each tab once opened
  // This technique improves the initial loading speed of the dashboard
  const [initTab, setInitTab] = useState<{
    [key: string]: boolean
  }>({})
  const [page, setPage] = useState(1)
  const [maxPages, setMaxPages] = useState(1)
  const { control, watch, setValue } = useForm({
    mode: 'all',
    defaultValues: {
      search: ''
    }
  })

  const searchValue = watch('search')

  const allBanners = useBanners()

  useEffect(() => {
    if (openTab !== prevOpenTab && !initTab?.[openTab]) {
      setInitTab((prev) => ({ ...prev, [openTab]: true }))
    }
  }, [openTab, prevOpenTab, initTab])

  // We want to change the query param without refreshing the page.
  const handleChangeQuery = useCallback((tab: string) => {
    if (window.location.href.includes('?tab=')) {
      window.history.pushState(null, '', `${window.location.href.split('?')[0]}?tab=${tab}`)
      return
    }

    window.history.pushState(null, '', `${window.location.href}?tab=${tab}`)
  }, [])

  const onScrollableEndReached = useCallback(() => {
    if (page < maxPages) {
      setPage((prevPage) => prevPage + 1)
    }
  }, [maxPages, page])

  useEffect(() => {
    setValue('search', '')
    setPage(1)
  }, [openTab, setValue])

  const tokens = useMemo(
    () =>
      accountPortfolio?.tokens
        .filter((token) => {
          if (!filterByNetworkId) return true
          if (filterByNetworkId === 'rewards') return token.flags.rewardsType
          if (filterByNetworkId === 'gasTank') return token.flags.onGasTank

          return token.networkId === filterByNetworkId
        })
        .filter((token) => {
          if (!searchValue) return true

          const doesAddressMatch = token.address.toLowerCase().includes(searchValue.toLowerCase())
          const doesSymbolMatch = token.symbol.toLowerCase().includes(searchValue.toLowerCase())

          return doesAddressMatch || doesSymbolMatch
        }),
    [accountPortfolio?.tokens, filterByNetworkId, searchValue]
  )

  const SECTIONS_DATA = useMemo(
    () => [
      {
        header: null,
        renderItem: ({ item }: { item: Banner }) => {
          return <DashboardBanner {...item} />
        },
        data: allBanners || []
      },
      {
        header: (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            <View
              style={[
                commonWebStyles.contentContainer,
                flexbox.directionRow,
                flexbox.justifySpaceBetween,
                flexbox.alignCenter,
                spacings.mb,
                !!allBanners.length && spacings.ptTy
              ]}
            >
              <Tabs
                handleChangeQuery={handleChangeQuery}
                setOpenTab={setOpenTab}
                openTab={openTab}
              />
              {['tokens', 'collectibles'].includes(openTab) && (
                <View style={{ margin: -2 }}>
                  <Search
                    containerStyle={{ flex: 1, maxWidth: isPopup ? 128 : 212 }}
                    control={control}
                    height={32}
                    placeholder={getSearchPlaceholder(openTab, t)}
                  />
                </View>
              )}
            </View>
            {openTab === 'tokens' && !!tokens?.length && (
              <View style={[flexbox.directionRow, spacings.mbTy, spacings.phTy]}>
                <Text
                  appearance="secondaryText"
                  fontSize={14}
                  weight="medium"
                  style={{ flex: 1.5 }}
                >
                  {t('ASSET/AMOUNT')}
                </Text>
                <Text
                  appearance="secondaryText"
                  fontSize={14}
                  weight="medium"
                  style={{ flex: 0.7 }}
                >
                  {t('PRICE')}
                </Text>
                <Text
                  appearance="secondaryText"
                  fontSize={14}
                  weight="medium"
                  style={{ flex: 0.8, textAlign: 'right' }}
                >
                  {t('USD VALUE')}
                </Text>
              </View>
            )}
          </View>
        ),
        renderItem: () => (
          <>
            {!!initTab?.tokens && (
              <Tokens
                searchValue={searchValue}
                tokens={tokens || []}
                pointerEvents={openTab !== 'tokens' ? 'none' : 'auto'}
                style={openTab !== 'tokens' ? HIDDEN_STYLE : {}}
                isLoading={!accountPortfolio?.isAllReady}
                page={page}
                maxPages={maxPages}
                setMaxPages={setMaxPages}
                tokenPreferences={tokenPreferences}
              />
            )}

            {!!initTab?.collectibles && (
              <Collections
                pointerEvents={openTab !== 'collectibles' ? 'none' : 'auto'}
                style={openTab !== 'collectibles' ? HIDDEN_STYLE : {}}
                searchValue={searchValue}
                page={page}
                setMaxPages={setMaxPages}
              />
            )}
          </>
        ),
        data: [{ id: 'tokens-list' }]
      }
    ],
    [
      allBanners,
      theme.primaryBackground,
      handleChangeQuery,
      openTab,
      control,
      t,
      tokens,
      initTab?.tokens,
      initTab?.collectibles,
      searchValue,
      accountPortfolio?.isAllReady,
      tokenPreferences,
      page,
      maxPages
    ]
  )

  return (
    <ScrollableWrapper
      type={WRAPPER_TYPES.SECTION_LIST}
      style={[spacings.ph0, commonWebStyles.contentContainer, !allBanners.length && spacings.mtTy]}
      contentContainerStyle={[
        isPopup && spacings.phSm,
        isPopup && spacings.prTy,
        allBanners.length ? spacings.ptTy : spacings.pt0,
        { flexGrow: 1 }
      ]}
      onScroll={(e) => onScroll(e.nativeEvent.contentOffset.y)}
      sections={SECTIONS_DATA}
      keyExtractor={(item, index) => {
        return item?.id || item + index
      }}
      renderItem={({ section: { renderItem } }: any) => renderItem}
      renderSectionHeader={({ section: { header } }) => header || null}
      stickySectionHeadersEnabled
      onEndReached={onScrollableEndReached}
      onEndReachedThreshold={0.5}
      initialNumToRender={10}
      removeClippedSubviews
      windowSize={5}
    />
  )
}

export default React.memo(DashboardSectionList)
