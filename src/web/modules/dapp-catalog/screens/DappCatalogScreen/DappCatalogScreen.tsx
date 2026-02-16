import Fuse from 'fuse.js'
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { Network } from '@ambire-common/interfaces/network'
import ConnectedIcon from '@common/assets/svg/ConnectedIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import StarIcon from '@common/assets/svg/StarIcon'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import spacings, { SPACING_MI, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import LayoutWrapper from '@web/components/LayoutWrapper'
import { AnimatedPressable, useCustomHover } from '@web/hooks/useHover'
import DappItem from '@web/modules/dapp-catalog/components/DappItem'
import { getUiType } from '@web/utils/uiType'

import DappsSkeletonLoader from '../../components/DappsSkeletonLoader'
import getStyles from './styles'

const { isPopup } = getUiType()

type FilterButtonType = {
  onPress: () => void
  children: ReactNode
  style?: ViewStyle
}

const FilterButton = React.memo(({ children, style, onPress }: FilterButtonType) => {
  const { styles, theme } = useTheme(getStyles)
  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: {
      from: theme.secondaryBackground,
      to: theme.tertiaryBackground
    }
  })

  return (
    <AnimatedPressable
      {...bindAnim}
      style={[styles.filterButton, animStyle, style]}
      onPress={onPress}
    >
      {children}
    </AnimatedPressable>
  )
})

const DappCatalogScreen = () => {
  const { control, watch, setValue } = useForm({ defaultValues: { search: '' } })
  const { t } = useTranslation()
  const { state } = useController('DappsController')
  const search = watch('search')
  const debouncedSearch = useDebounce({ value: search, delay: 350 })
  const [initialDAppListState, setInitialDAppListState] = useState<Dapp[]>([])
  const [network, setNetwork] = useState<Network | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [favoritesSelected, setFavoritesSelected] = useState(false)
  const [connectedSelected, setConnectedSelected] = useState(false)
  const { networks: allNetworks } = useController('NetworksController').state
  const { theme } = useTheme()

  const searchableDapps = useMemo(
    () =>
      state.dapps.map((dapp) => ({
        dapp,
        name: dapp.name.toLowerCase(),
        url: dapp.url.toLowerCase(),
        description: dapp.description?.toLowerCase() || ''
      })),
    [state.dapps]
  )

  const filteredDapps = useMemo(() => {
    if (!state?.dapps?.length) return []

    // Apply search filter with fuse.js if there's a search query
    let searchFilteredDapps = state.dapps
    if (debouncedSearch) {
      const fuse = new Fuse(searchableDapps, {
        keys: [
          { name: 'name', weight: 0.7 },
          { name: 'url', weight: 0.2 },
          { name: 'description', weight: 0.1 }
        ],
        shouldSort: false,
        threshold: 0.2, // more strict, better less results than too random
        minMatchCharLength: 1
      })

      const results = fuse.search(debouncedSearch)
      searchFilteredDapps = results.map((result) => result.item.dapp)
    }

    // Apply other filters (network, category, favorites, connected)
    return searchFilteredDapps.filter((dapp) => {
      const networkMatch = !network || dapp.chainIds?.includes(Number(network.chainId))
      const categoryMatch = !category || dapp.category?.toLowerCase() === category.toLowerCase()
      const favoritesMatch = !favoritesSelected || dapp.favorite
      const connectedMatch = !connectedSelected || dapp.isConnected

      return networkMatch && categoryMatch && favoritesMatch && connectedMatch
    })
  }, [
    state.dapps,
    debouncedSearch,
    network,
    category,
    favoritesSelected,
    connectedSelected,
    searchableDapps
  ])

  const handleSetNetworkValue = useCallback(
    (networkOption: SelectValue) => {
      if (networkOption.value === 'all') {
        setNetwork(null)
        return
      }
      setNetwork(allNetworks.filter((n) => n.name === networkOption.value)[0] ?? null)
      setValue('search', '')
    },
    [allNetworks, setValue]
  )

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
    [theme, t]
  )

  const networksOptions: SelectValue[] = useMemo(
    () => [
      ALL_NETWORKS_OPTION,
      ...allNetworks.map((n) => ({
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

  const handleSetCategoryValue = useCallback(
    (categoryOption: SelectValue) => {
      if (categoryOption.value === 'all') {
        setCategory(null)
        return
      }
      setCategory(categoryOption.value as string)
      setValue('search', '')
    },
    [setValue]
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
      ...state.categories.map((c) => ({
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

  const handleSelectPredefinedFilter = useCallback(
    (type: 'favorites' | 'connected') => {
      if (type === 'favorites') setFavoritesSelected((p) => !p)
      if (type === 'connected') setConnectedSelected((p) => !p)
      setValue('search', '')
    },
    [setValue]
  )

  const renderItem = useCallback(({ item }: { item: Dapp }) => <DappItem {...item} />, [])

  const handleResetFilters = useCallback(() => {
    setValue('search', '')
    setNetwork(null)
    setCategory(null)
    setFavoritesSelected(false)
    setConnectedSelected(false)
  }, [setValue])

  useEffect(() => {
    const shouldDoInitialSet = !initialDAppListState.length && state.dapps.length
    const aDAppWasRemoved = initialDAppListState.length > state.dapps.length
    if (shouldDoInitialSet || aDAppWasRemoved) {
      setInitialDAppListState(state.dapps)
    }
  }, [initialDAppListState, state.dapps])

  const noAppsFoundText = useMemo(() => {
    const filters = []
    if (debouncedSearch) filters.push(`Search - "${debouncedSearch}"`)
    if (network) filters.push(`Network - "${network.name}"`)
    if (category && category !== ALL_CATEGORIES_OPTION.value)
      filters.push(`Category - "${category}"`)
    if (favoritesSelected) filters.push('"Favorites"')
    if (connectedSelected) filters.push('"Connected"')

    return {
      mainText: filters.length ? 'No apps found matching your selected filters.' : 'No apps found',
      filtersText: filters.length ? `Active filters: ${filters.join(', ')}` : ''
    }
  }, [
    ALL_CATEGORIES_OPTION,
    category,
    connectedSelected,
    debouncedSearch,
    favoritesSelected,
    network
  ])

  return (
    <LayoutWrapper>
      <HeaderWithTitle />
      {!state.isReadyToDisplayDapps || !state.dapps.length ? (
        <DappsSkeletonLoader />
      ) : (
        <View style={[flexbox.flex1]}>
          <View style={[spacings.phSm, spacings.pvSm, spacings.mbSm]}>
            <Search
              placeholder={t('Search for an app')}
              control={control}
              // @ts-ignore
              setValue={setValue}
              autoFocus
              containerStyle={{
                ...spacings.mbSm,
                ...flexbox.flex1
              }}
            />
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Select
                setValue={handleSetNetworkValue}
                containerStyle={{
                  width: 164,
                  marginBottom: 0,
                  ...spacings.mrTy
                }}
                menuOptionHeight={32}
                options={networksOptions}
                menuProps={{ width: 200 }}
                value={
                  networksOptions.filter((opt) => opt.value === network?.name)[0] ??
                  ALL_NETWORKS_OPTION
                }
                clearValue={() => setNetwork(null)}
                withClearButton={!!network && network?.name !== ALL_NETWORKS_OPTION.value}
                size="sm"
                selectBorderWrapperStyle={{ borderRadius: 50 }}
                selectStyle={{
                  borderRadius: 50,
                  height: 32,
                  ...spacings.prSm,
                  ...spacings.plMi,
                  backgroundColor: theme.secondaryBackground
                }}
                hoveredSelectStyle={{
                  backgroundColor: theme.tertiaryBackground
                }}
              />
              <Select
                setValue={handleSetCategoryValue}
                containerStyle={{
                  width: 164,
                  marginBottom: 0,
                  ...spacings.mrTy
                }}
                options={categoryOptions}
                value={
                  categoryOptions.filter((opt) => opt.value === category)[0] ??
                  ALL_CATEGORIES_OPTION
                }
                menuOptionHeight={32}
                clearValue={() => setCategory(null)}
                withClearButton={!!category && category !== ALL_CATEGORIES_OPTION.value}
                size="sm"
                menuProps={{ width: 230 }}
                selectBorderWrapperStyle={{ borderRadius: 50 }}
                selectStyle={{
                  borderRadius: 50,
                  height: 32,
                  ...spacings.phSm,
                  backgroundColor: theme.secondaryBackground
                }}
                hoveredSelectStyle={{
                  backgroundColor: theme.tertiaryBackground
                }}
              />
              <FilterButton
                onPress={() => handleSelectPredefinedFilter('favorites')}
                style={spacings.mrTy}
              >
                <StarIcon
                  width={20}
                  height={20}
                  color={favoritesSelected ? theme.warning400 : theme.iconPrimary}
                />
              </FilterButton>
              <FilterButton onPress={() => handleSelectPredefinedFilter('connected')}>
                <ConnectedIcon
                  width={20}
                  height={20}
                  color={connectedSelected ? theme.success400 : theme.iconPrimary}
                />
              </FilterButton>
            </View>
          </View>
          <ScrollableWrapper
            type={WRAPPER_TYPES.FLAT_LIST}
            contentContainerStyle={[
              spacings.plSm,
              spacings.pbSm,
              { paddingRight: SPACING_SM - SPACING_MI / 2 }
            ]}
            style={!isPopup ? spacings.pbSm : {}}
            data={filteredDapps}
            renderItem={renderItem}
            keyExtractor={(item: Dapp) => item.url.toString()}
            ListEmptyComponent={
              <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter, spacings]}>
                <View style={{ maxWidth: 400 }}>
                  <Text style={[text.center, !!noAppsFoundText.filtersText && spacings.mbLg]}>
                    <Text weight="medium" style={[text.center, spacings.mbSm, { lineHeight: 30 }]}>
                      {noAppsFoundText.mainText}
                    </Text>
                    {!!noAppsFoundText.filtersText && '\n'}
                    <Text fontSize={14} appearance="secondaryText" style={text.center}>
                      {noAppsFoundText.filtersText}
                    </Text>
                  </Text>
                </View>
                {!!noAppsFoundText.filtersText && (
                  <Button
                    text={t('Reset filters')}
                    onPress={handleResetFilters}
                    size="small"
                    style={{ height: 40 }}
                    hasBottomSpacing={false}
                  />
                )}
              </View>
            }
          />
        </View>
      )}
    </LayoutWrapper>
  )
}

export default React.memo(DappCatalogScreen)
