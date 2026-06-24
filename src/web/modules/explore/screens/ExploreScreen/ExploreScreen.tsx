import Fuse from 'fuse.js'
import React, { useCallback, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Dapp, TrendingToken } from '@ambire-common/interfaces/dapp'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useNavigation from '@common/hooks/useNavigation'
import ClearRecentsBottomSheet, {
  ClearRecentsBottomSheetHandle
} from '@common/modules/explore/components/ClearRecentsBottomSheet'
import DappItem from '@common/modules/explore/components/DappItem'
import DappsSkeletonLoader from '@common/modules/explore/components/DappsSkeletonLoader'
import HorizontalDappsRow from '@common/modules/explore/components/HorizontalDappsRow'
import SectionHeader from '@common/modules/explore/components/SectionHeader'
import TrendingTokenItem from '@common/modules/explore/components/TrendingTokenItem'
import { MAX_TRENDING_TOKENS_ON_EXPLORE } from '@common/modules/explore/constants/trending'
import { filterTrendingTokensBySearch } from '@common/modules/explore/helpers/filterTrendingTokens'
import useExploreSections, {
  ExploreSection
} from '@common/modules/explore/hooks/useExploreSections'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type SectionItem =
  | { kind: 'dapp'; dapp: Dapp }
  | { kind: 'row'; dapps: Dapp[] }
  | { kind: 'trendingToken'; token: TrendingToken }

type SearchResult = { kind: 'dapp'; dapp: Dapp } | { kind: 'trendingToken'; token: TrendingToken }

const ExploreScreen = () => {
  const { control, watch, setValue } = useForm({ defaultValues: { search: '' } })
  const { t } = useTranslation()
  const { state } = useController('DappsController')
  const { navigate } = useNavigation()
  const search = watch('search')
  const debouncedSearch = useDebounce({ value: search, delay: 350 })
  const clearRecentsRef = useRef<ClearRecentsBottomSheetHandle>(null)

  const sections = useExploreSections()

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

  const handleClearRecentsPress = useCallback(() => {
    clearRecentsRef.current?.open()
  }, [])

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

  const searchResults: SearchResult[] = useMemo(() => {
    if (!debouncedSearch) return []
    const tokenResults: SearchResult[] = filterTrendingTokensBySearch(
      state.trendingTokens || [],
      debouncedSearch
    ).map((token) => ({ kind: 'trendingToken' as const, token }))
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
    const dappResults: SearchResult[] = fuse
      .search(debouncedSearch)
      .map((r) => ({ kind: 'dapp' as const, dapp: r.item.dapp }))
    return [...tokenResults, ...dappResults]
  }, [debouncedSearch, searchableDapps, state.trendingTokens])

  const renderSearchItem = useCallback(({ item }: { item: SearchResult }) => {
    if (item.kind === 'trendingToken') return <TrendingTokenItem token={item.token} />
    return <DappItem {...item.dapp} />
  }, [])

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
          data:
            s.type === 'apps'
              ? s.data.map((d) => ({ kind: 'dapp' as const, dapp: d }))
              : [{ kind: 'row' as const, dapps: s.data }]
        }
      }),
    [sections]
  )

  const renderSectionItem = useCallback(({ item }: { item: SectionItem }) => {
    if (item.kind === 'row') return <HorizontalDappsRow data={item.dapps} />
    if (item.kind === 'trendingToken') return <TrendingTokenItem token={item.token} />
    return <DappItem {...item.dapp} />
  }, [])

  const renderSectionHeader = useCallback(
    ({ section }: { section: { type: ExploreSection['type'] } }) => {
      const matching = sections.find((s) => s.type === section.type)
      if (!matching) return null
      return (
        <SectionHeader
          icon={matching.icon}
          title={matching.title}
          onPress={() => handleOpenSection(matching)}
          showTrash={matching.showTrash}
          onTrashPress={matching.showTrash ? handleClearRecentsPress : undefined}
        />
      )
    },
    [sections, handleOpenSection, handleClearRecentsPress]
  )

  const sectionKeyExtractor = useCallback((item: SectionItem, index: number) => {
    if (item.kind === 'dapp') return item.dapp.id
    if (item.kind === 'trendingToken') return `trending-${item.token.id}`
    return `row-${index}`
  }, [])

  return (
    <LayoutWrapper>
      <HeaderWithTitle />
      {!state.isReadyToDisplayDapps || !state.dapps?.length ? (
        <DappsSkeletonLoader />
      ) : (
        <View style={[flexbox.flex1]}>
          <View style={spacings.phSm}>
            <Search
              placeholder={t('Search apps, tokens or URLs')}
              control={control}
              // @ts-ignore
              setValue={setValue}
              autoFocus
              containerStyle={spacings.mbTy}
            />
          </View>
          {debouncedSearch ? (
            <ScrollableWrapper
              type={WRAPPER_TYPES.FLAT_LIST}
              data={searchResults}
              renderItem={renderSearchItem as any}
              keyExtractor={(item: SearchResult) =>
                item.kind === 'dapp' ? item.dapp.id : `trending-${item.token.id}`
              }
              style={spacings.phSm}
              contentContainerStyle={spacings.pr0}
            />
          ) : (
            <ScrollableWrapper
              type={WRAPPER_TYPES.SECTION_LIST}
              data={sectionListData}
              renderItem={renderSectionItem as any}
              renderSectionHeader={renderSectionHeader as any}
              keyExtractor={sectionKeyExtractor as any}
              stickySectionHeadersEnabled={false}
              style={spacings.phSm}
              contentContainerStyle={spacings.pr0}
            />
          )}
        </View>
      )}
      <ClearRecentsBottomSheet ref={clearRecentsRef} />
    </LayoutWrapper>
  )
}

export default React.memo(ExploreScreen)
