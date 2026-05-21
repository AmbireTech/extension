import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Pressable, View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { Network } from '@ambire-common/interfaces/network'
import DeleteIcon from '@common/assets/svg/DeleteIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import ClearRecentsBottomSheet, {
  ClearRecentsBottomSheetHandle
} from '@common/modules/explore/components/ClearRecentsBottomSheet'
import DappItem from '@common/modules/explore/components/DappItem'
import useExploreFilteredDapps from '@common/modules/explore/hooks/useExploreFilteredDapps'
import { ExploreSectionType } from '@common/modules/explore/hooks/useExploreSections'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

const TYPE_TITLES: Record<ExploreSectionType, string> = {
  recent: 'Recent',
  connected: 'Connected',
  favorites: 'Favorites',
  apps: 'Explore apps'
}

const ExploreSectionScreen = () => {
  const { t } = useTranslation()
  const { params } = useRoute()
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const { state } = useController('DappsController')
  const { networks: allNetworks } = useController('NetworksController').state
  const { control, watch, setValue } = useForm({ defaultValues: { search: '' } })
  const [network, setNetwork] = useState<Network | null>(null)
  const [category, setCategory] = useState<string | null>(null)

  const clearRecentsRef = useRef<ClearRecentsBottomSheetHandle>(null)

  const sectionType: ExploreSectionType = (params?.type as ExploreSectionType) || 'apps'
  const title = (params?.title as string) || t(TYPE_TITLES[sectionType])
  const search = watch('search')
  const debouncedSearch = useDebounce({ value: search, delay: 350 })

  const dapps = useExploreFilteredDapps({
    type: sectionType,
    allDapps: state.dapps || [],
    recentDapps: state.recentDapps || [],
    search: debouncedSearch,
    network,
    category
  })

  const ALL_NETWORKS_OPTION = useMemo(
    () => ({
      value: 'all',
      label: (
        <Text weight="medium" fontSize={12} numberOfLines={1} appearance="secondaryText">
          {t('All networks')}
        </Text>
      ),
      icon: (
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.neutral200,
            ...flexbox.center
          }}
        >
          <NetworksIcon width={20} height={20} color={theme.iconPrimary} />
        </View>
      )
    }),
    [t, theme]
  )

  const networksOptions: SelectValue[] = useMemo(
    () => [
      ALL_NETWORKS_OPTION,
      ...allNetworks.map((n: Network) => ({
        value: n.name,
        label: (
          <Text weight="medium" fontSize={12} numberOfLines={1}>
            {n.name}
          </Text>
        ),
        icon: <NetworkIcon size={24} key={n.chainId.toString()} id={n.chainId.toString()} />
      }))
    ],
    [allNetworks, ALL_NETWORKS_OPTION]
  )

  const ALL_CATEGORIES_OPTION = useMemo(
    () => ({
      value: 'all',
      label: (
        <Text weight="medium" fontSize={12} numberOfLines={1} appearance="secondaryText">
          {t('All categories')}
        </Text>
      )
    }),
    [t]
  )

  const categoryOptions: SelectValue[] = useMemo(
    () => [
      ALL_CATEGORIES_OPTION,
      ...(state.categories || []).map((c: string) => ({
        value: c,
        label: (
          <Text weight="medium" fontSize={12} numberOfLines={1}>
            {c}
          </Text>
        )
      }))
    ],
    [state.categories, ALL_CATEGORIES_OPTION]
  )

  const handleSetNetworkValue = useCallback(
    (option: SelectValue) => {
      if (option.value === 'all') return setNetwork(null)
      const next = allNetworks.find((n: Network) => n.name === option.value) ?? null
      setNetwork(next)
    },
    [allNetworks]
  )

  const handleSetCategoryValue = useCallback((option: SelectValue) => {
    if (option.value === 'all') return setCategory(null)
    setCategory(option.value as string)
  }, [])

  const handleClearRecentPress = useCallback(() => {
    clearRecentsRef.current?.open()
  }, [])

  const renderItem = useCallback(({ item }: { item: Dapp }) => <DappItem {...item} />, [])

  return (
    <MobileLayoutContainer>
      <MobileLayoutWrapperMainContent
        withBackButton
        title={title}
        onBackButtonPress={() => navigate(ROUTES.explore)}
        withScroll={false}
        rightIcon={
          sectionType === 'recent' ? (
            <Pressable onPress={handleClearRecentPress} hitSlop={8}>
              <DeleteIcon width={24} height={24} strokeWidth="1.75" />
            </Pressable>
          ) : undefined
        }
      >
        <View style={flexbox.flex1}>
          <View style={[spacings.mbSm]}>
            <Search
              placeholder={t('Search')}
              control={control}
              // @ts-ignore
              setValue={setValue}
              containerStyle={sectionType === 'apps' ? spacings.mbTy : spacings.mb0}
            />
            {sectionType === 'apps' && (
              <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                <Select
                  setValue={handleSetNetworkValue}
                  containerStyle={{
                    flexShrink: 1,
                    marginBottom: 0,
                    ...spacings.mrTy
                  }}
                  menuOptionHeight={38}
                  options={networksOptions}
                  menuProps={{ width: 200 }}
                  value={
                    networksOptions.find((opt) => opt.value === network?.name) ??
                    ALL_NETWORKS_OPTION
                  }
                  clearValue={() => setNetwork(null)}
                  withClearButton={!!network}
                  size="sm"
                  selectBorderWrapperStyle={{ borderRadius: 50 }}
                  selectStyle={{
                    borderRadius: 50,
                    height: 32,
                    ...spacings.prSm,
                    ...spacings.plMi,
                    backgroundColor: theme.secondaryBackground
                  }}
                  hoveredSelectStyle={{ backgroundColor: theme.tertiaryBackground }}
                  bottomSheetTitle={t('Select network')}
                />
                <Select
                  setValue={handleSetCategoryValue}
                  containerStyle={{
                    flexShrink: 1,
                    marginBottom: 0
                  }}
                  options={categoryOptions}
                  value={
                    categoryOptions.find((opt) => opt.value === category) ?? ALL_CATEGORIES_OPTION
                  }
                  menuOptionHeight={38}
                  clearValue={() => setCategory(null)}
                  withClearButton={!!category}
                  size="sm"
                  menuProps={{ width: 230 }}
                  selectBorderWrapperStyle={{ borderRadius: 50 }}
                  selectStyle={{
                    borderRadius: 50,
                    height: 32,
                    ...spacings.phSm,
                    backgroundColor: theme.secondaryBackground
                  }}
                  hoveredSelectStyle={{ backgroundColor: theme.tertiaryBackground }}
                  bottomSheetTitle={t('Select category')}
                />
              </View>
            )}
          </View>
          <ScrollableWrapper
            type={WRAPPER_TYPES.FLAT_LIST}
            data={dapps}
            renderItem={renderItem}
            keyExtractor={(item: Dapp) => item.id}
            ListEmptyComponent={
              <View style={[flexbox.center, spacings.pv]}>
                <Text appearance="secondaryText" style={text.center}>
                  {t('No apps found')}
                </Text>
              </View>
            }
          />
        </View>
      </MobileLayoutWrapperMainContent>
      <ClearRecentsBottomSheet ref={clearRecentsRef} />
    </MobileLayoutContainer>
  )
}

export default React.memo(ExploreSectionScreen)
