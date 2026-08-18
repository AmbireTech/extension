import Fuse from 'fuse.js'
import React, { useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { Dapp, TrendingToken } from '@ambire-common/interfaces/dapp'
import { isValidHostname, isValidURL } from '@ambire-common/services/validations'
import GlobeIcon from '@common/assets/svg/GlobeIcon'
import GoogleIcon from '@common/assets/svg/GoogleIcon'
import ScanIcon from '@common/assets/svg/ScanIcon'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import { AnimatedPressable } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import DappItem from '@common/modules/explore/components/DappItem'
import DappsSkeletonLoader from '@common/modules/explore/components/DappsSkeletonLoader'
import HorizontalDappsRow from '@common/modules/explore/components/HorizontalDappsRow'
import SectionHeader from '@common/modules/explore/components/SectionHeader'
import TrendingTokenItem from '@common/modules/explore/components/TrendingTokenItem'
import { filterTrendingTokensBySearch } from '@common/modules/explore/helpers/filterTrendingTokens'
import useExploreSections, {
  ExploreSection
} from '@common/modules/explore/hooks/useExploreSections'
import { MAX_TRENDING_TOKENS_ON_EXPLORE } from '@common/modules/explore/constants/trending'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

type SearchItem =
  | { type: 'googleSearch'; query: string }
  | { type: 'openPage'; query: string }
  | { type: 'trendingToken'; token: TrendingToken }
  | { type: 'dapp'; dapp: Dapp }

const ExploreScreen = () => {
  const { control, watch, setValue } = useForm({ defaultValues: { search: '' } })
  const { t } = useTranslation()
  const { state } = useController('DappsController')
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const search = watch('search')
  const debouncedSearch = useDebounce({ value: search, delay: 350 })

  const sections = useExploreSections()

  const handleQrPress = useCallback(() => navigate(ROUTES.qrReader), [navigate])

  const handleNavigateToUrl = useCallback(
    (url: string) => navigate(ROUTES.dappWebView, { state: { url } }),
    [navigate]
  )

  const handleOpenSection = useCallback(
    (section: ExploreSection) => {
      // Trending has its own "see all" screen since its items are tokens, not dapps.
      if (section.type === 'trending') {
        navigate(ROUTES.trendingTokens)
        return
      }
      navigate(ROUTES.exploreSection, { state: { type: section.type, title: section.title } })
    },
    [navigate]
  )

  // Search mode: collapse sections into the flat list with Google/open-URL suggestions,
  // matching the prior screen's behavior.
  const searchableDapps = useMemo(
    () =>
      (state.dapps || []).map((dapp: Dapp) => ({
        dapp,
        name: dapp.name.toLowerCase(),
        url: dapp.url.toLowerCase(),
        description: dapp.description?.toLowerCase() || ''
      })),
    [state.dapps]
  )

  const searchResults: SearchItem[] = useMemo(() => {
    if (!debouncedSearch) return []
    const items: SearchItem[] = [{ type: 'googleSearch', query: debouncedSearch }]
    if (isValidURL(debouncedSearch) || isValidHostname(debouncedSearch)) {
      items.push({ type: 'openPage', query: debouncedSearch })
    }
    filterTrendingTokensBySearch(state.trendingTokens || [], debouncedSearch).forEach((token) =>
      items.push({ type: 'trendingToken', token })
    )
    const fuse = new Fuse(searchableDapps, {
      keys: [
        { name: 'name', weight: 0.7 },
        { name: 'url', weight: 0.2 },
        { name: 'description', weight: 0.1 }
      ],
      shouldSort: false,
      threshold: 0.2,
      minMatchCharLength: 1
    })
    fuse.search(debouncedSearch).forEach((r) => items.push({ type: 'dapp', dapp: r.item.dapp }))
    return items
  }, [debouncedSearch, searchableDapps, state.trendingTokens])

  const renderSearchItem = useCallback(
    ({ item }: { item: SearchItem }) => {
      if (item.type === 'openPage') {
        const url = isValidURL(item.query) ? item.query : `https://${item.query}`
        return (
          <AnimatedPressable
            onPress={() => handleNavigateToUrl(url)}
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
              {t('Open "{{query}}"', { query: item.query })}
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
              {t('Search Google for "{{query}}"', { query: item.query })}
            </Text>
          </AnimatedPressable>
        )
      }
      if (item.type === 'trendingToken') return <TrendingTokenItem token={item.token} />
      return <DappItem {...item.dapp} />
    },
    [t, theme.secondaryBackground, handleNavigateToUrl]
  )

  // Wrap each section's data into renderable items. "apps" and "trending" stay vertical (one item
  // per entry); Recent/Connected/Favorites collapse into a single horizontal carousel item.
  const sectionListData = useMemo(
    () =>
      sections.map((s) => {
        if (s.type === 'trending') {
          return {
            ...s,
            data: s.trendingTokens
              .slice(0, MAX_TRENDING_TOKENS_ON_EXPLORE)
              .map((token) => ({ kind: 'trendingToken' as const, token }))
          }
        }
        return {
          ...s,
          // For horizontal sections we pass a single sentinel item; the carousel renders all dapps internally.
          data:
            s.type === 'apps'
              ? s.data.map((d) => ({ kind: 'dapp' as const, dapp: d }))
              : [{ kind: 'row' as const, dapps: s.data }]
        }
      }),
    [sections]
  )

  type SectionItem =
    | { kind: 'dapp'; dapp: Dapp }
    | { kind: 'row'; dapps: Dapp[] }
    | { kind: 'trendingToken'; token: TrendingToken }

  const renderSectionItem = useCallback(({ item }: { item: SectionItem }) => {
    if (item.kind === 'row') return <HorizontalDappsRow data={item.dapps} />
    if (item.kind === 'trendingToken') return <TrendingTokenItem token={item.token} />
    return <DappItem {...item.dapp} />
  }, [])

  const renderSectionHeader = useCallback(
    ({
      section
    }: {
      section: {
        type: ExploreSection['type']
        title: string
        icon: React.ReactNode
      }
    }) => {
      const matching = sections.find((s) => s.type === section.type)
      if (!matching) return null
      return (
        <SectionHeader
          icon={matching.icon}
          title={matching.title}
          onPress={() => handleOpenSection(matching)}
        />
      )
    },
    [sections, handleOpenSection]
  )

  const sectionKeyExtractor = useCallback((item: SectionItem, index: number) => {
    if (item.kind === 'dapp') return item.dapp.id
    if (item.kind === 'trendingToken') return `trending-${item.token.id}`
    return `row-${index}`
  }, [])

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        title={t('Explore')}
        onBackButtonPress={() => navigate(ROUTES.dashboard)}
        rightIcon={
          <Pressable onPress={handleQrPress}>
            <ScanIcon width={24} height={24} />
          </Pressable>
        }
        withScroll={false}
      >
        {!state.isReadyToDisplayDapps || !state.dapps?.length ? (
          <DappsSkeletonLoader />
        ) : (
          <View style={flexbox.flex1}>
            <View style={[spacings.mbSm]}>
              <Search
                placeholder={t('Search apps, tokens or URLs')}
                control={control}
                // @ts-ignore
                setValue={setValue}
              />
            </View>
            {debouncedSearch ? (
              <ScrollableWrapper
                type={WRAPPER_TYPES.FLAT_LIST}
                data={searchResults}
                renderItem={renderSearchItem as any}
                keyExtractor={(item: SearchItem, idx: number) =>
                  item.type === 'dapp' ? item.dapp.id : `${item.type}-${idx}`
                }
                contentContainerStyle={spacings.ph0}
              />
            ) : (
              <ScrollableWrapper
                type={WRAPPER_TYPES.SECTION_LIST}
                data={sectionListData}
                renderItem={renderSectionItem as any}
                renderSectionHeader={renderSectionHeader as any}
                keyExtractor={sectionKeyExtractor as any}
                stickySectionHeadersEnabled={false}
              />
            )}
          </View>
        )}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(ExploreScreen)
