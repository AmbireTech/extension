import Fuse from 'fuse.js'
import React, { useCallback, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
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
import useExploreSections, {
  ExploreSection
} from '@common/modules/explore/hooks/useExploreSections'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type SectionItem = { kind: 'dapp'; dapp: Dapp } | { kind: 'row'; dapps: Dapp[] }

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
    (section: ExploreSection) =>
      navigate(ROUTES.exploreSection, { state: { type: section.type, title: section.title } }),
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

  const searchResults: Dapp[] = useMemo(() => {
    if (!debouncedSearch) return []
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
    return fuse.search(debouncedSearch).map((r) => r.item.dapp)
  }, [debouncedSearch, searchableDapps])

  const renderSearchItem = useCallback(({ item }: { item: Dapp }) => <DappItem {...item} />, [])

  const sectionListData = useMemo(
    () =>
      sections.map((s) => ({
        ...s,
        data:
          s.type === 'apps'
            ? s.data.map((d) => ({ kind: 'dapp' as const, dapp: d }))
            : [{ kind: 'row' as const, dapps: s.data }]
      })),
    [sections]
  )

  const renderSectionItem = useCallback(({ item }: { item: SectionItem }) => {
    if (item.kind === 'row') return <HorizontalDappsRow data={item.dapps} />
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

  const sectionKeyExtractor = useCallback(
    (item: SectionItem, index: number) => (item.kind === 'dapp' ? item.dapp.id : `row-${index}`),
    []
  )

  return (
    <LayoutWrapper>
      <HeaderWithTitle />
      {!state.isReadyToDisplayDapps || !state.dapps?.length ? (
        <DappsSkeletonLoader />
      ) : (
        <View style={[flexbox.flex1]}>
          <View style={spacings.phSm}>
            <Search
              placeholder={t('Search for an app')}
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
              keyExtractor={(item: Dapp) => item.id}
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
