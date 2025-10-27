import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { Network } from '@ambire-common/interfaces/network'
import ConnectedIcon from '@common/assets/svg/ConnectedIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import StarIcon from '@common/assets/svg/StarIcon'
import BackButton from '@common/components/BackButton'
import NetworkIcon from '@common/components/NetworkIcon'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useDebounce from '@common/hooks/useDebounce'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import spacings, { SPACING_MI, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  TabLayoutContainer,
  tabLayoutWidths
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import useDappsControllerState from '@web/hooks/useDappsControllerState'
import { AnimatedPressable, useMultiHover } from '@web/hooks/useHover'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import DappItem from '@web/modules/dapp-catalog/components/DappItem'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

type FilterButtonType = {
  value: 'all' | 'favorites' | 'connected'
  icon: React.JSX.Element
  active?: boolean
  onPress: (type: 'all' | 'favorites' | 'connected') => void
  style?: ViewStyle
}

const ALL_NETWORKS_OPTION = {
  value: 'all',
  label: (
    <Text weight="medium" fontSize={12} numberOfLines={1} appearance="secondaryText">
      All networks
    </Text>
  ),
  icon: <NetworksIcon width={18} height={18} />
}

const ALL_CATEGORIES_OPTION = {
  value: 'all',
  label: (
    <Text weight="medium" fontSize={12} numberOfLines={1} appearance="secondaryText">
      All categories
    </Text>
  )
}

const FilterButton = React.memo(({ value, icon, active, style, onPress }: FilterButtonType) => {
  const { styles, theme } = useTheme(getStyles)

  const buttonColors = useMemo(
    () => ({
      filterButton: [
        {
          property: 'borderColor',
          from: theme.secondaryBorder,
          to: theme.primary
        }
      ]
    }),
    [theme]
  )

  const [bind, animatedStyle] = useMultiHover({
    values: buttonColors.filterButton as any
  })

  return (
    <AnimatedPressable
      {...bind}
      style={[
        styles.filterButton,
        animatedStyle,
        active && styles.filterButtonHovered,
        active && styles.filterButtonActive,
        style
      ]}
      onPress={() => onPress(value)}
    >
      {({ hovered }: any) => (
        <>
          <Text
            fontSize={12}
            weight="medium"
            style={spacings.mrTy}
            color={active ? '#FFF' : hovered ? theme.primary : theme.secondaryText}
          >
            {`${value.charAt(0).toUpperCase()}${value.slice(1)}`}
          </Text>
          {icon}
        </>
      )}
    </AnimatedPressable>
  )
})

const { isPopup } = getUiType()

const DappCatalogScreen = () => {
  const { control, watch, setValue } = useForm({
    defaultValues: { search: '' }
  })

  const { t } = useTranslation()
  const { state } = useDappsControllerState()
  const [predefinedFilter, setPredefinedFilter] = useState<
    'all' | 'favorites' | 'connected' | null
  >(null)
  const search = watch('search')
  const debouncedSearch = useDebounce({ value: search, delay: 350 })
  const [initialDAppListState, setInitialDAppListState] = useState<Dapp[]>([])
  const [network, setNetwork] = useState<Network | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const { allNetworks } = useNetworksControllerState()
  const { theme, themeType } = useTheme()

  const filteredDapps = useMemo(() => {
    const allDapps = state.dapps
    if (search && debouncedSearch) {
      if (predefinedFilter) setPredefinedFilter(null)
      return allDapps.filter((dapp) => dapp.name.toLowerCase().includes(search.toLowerCase()))
    }
    if (!predefinedFilter) setPredefinedFilter('all')
    if (predefinedFilter === 'favorites') return allDapps.filter((dapp) => !!dapp.favorite)
    if (predefinedFilter === 'connected') return allDapps.filter((dapp) => dapp.isConnected)

    return allDapps
  }, [state.dapps, search, debouncedSearch, predefinedFilter])

  if (search) {
    console.log(filteredDapps)
  }

  const handleSetNetworkValue = useCallback(
    (networkOption: SelectValue) => {
      if (networkOption.value === 'all') {
        setNetwork(null)
        return
      }
      setNetwork(allNetworks.filter((n) => n.name === networkOption.value)[0])
      setPredefinedFilter('all')
      setValue('search', '')
    },
    [allNetworks, setValue]
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
        icon: <NetworkIcon size={18} key={n.chainId.toString()} id={n.chainId.toString()} />
      }))
    ],
    [allNetworks]
  )

  const handleSetCategoryValue = useCallback(
    (categoryOption: SelectValue) => {
      if (categoryOption.value === 'all') {
        setCategory(null)
        return
      }
      setCategory(categoryOption.value as string)
      setPredefinedFilter('all')
      setValue('search', '')
    },
    [setValue]
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
    [state.categories]
  )

  const handleSelectPredefinedFilter = useCallback(
    (type: 'all' | 'favorites' | 'connected') => {
      setPredefinedFilter(type)
      setValue('search', '')
    },
    [setValue]
  )

  const renderItem = useCallback(({ item }: { item: Dapp }) => <DappItem {...item} />, [])

  useEffect(() => {
    const shouldDoInitialSet = !initialDAppListState.length && state.dapps.length
    const aDAppWasRemoved = initialDAppListState.length > state.dapps.length
    if (shouldDoInitialSet || aDAppWasRemoved) {
      setInitialDAppListState(state.dapps)
    }
  }, [initialDAppListState, state.dapps])

  return (
    <TabLayoutContainer
      hideFooterInPopup
      width="xl"
      footer={<BackButton />}
      footerStyle={{ maxWidth: tabLayoutWidths.xl }}
      header={<Header mode="title" withAmbireLogo />}
      withHorizontalPadding={!isPopup}
    >
      <View style={[flexbox.flex1]}>
        <View style={[!!isPopup && spacings.phSm, spacings.pvSm]}>
          <Search
            placeholder={t('Search for an app')}
            control={control}
            setValue={setValue}
            autoFocus
            containerStyle={spacings.mbTy}
          />
          <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
            <Select
              setValue={handleSetNetworkValue}
              containerStyle={{ width: 164, marginBottom: 0 }}
              options={networksOptions}
              value={
                networksOptions.filter((opt) => opt.value === network?.name)[0] ??
                ALL_NETWORKS_OPTION
              }
              size="sm"
              selectBorderWrapperStyle={{ borderRadius: 50 }}
              selectStyle={{
                borderRadius: 50,
                height: 32,
                ...(themeType === THEME_TYPES.DARK
                  ? { backgroundColor: theme.tertiaryBackground }
                  : {})
              }}
            />
            <Select
              setValue={handleSetCategoryValue}
              containerStyle={{ width: 164, marginBottom: 0 }}
              options={categoryOptions}
              value={
                categoryOptions.filter((opt) => opt.value === category)[0] ?? ALL_CATEGORIES_OPTION
              }
              size="sm"
              selectBorderWrapperStyle={{ borderRadius: 50 }}
              selectStyle={{
                borderRadius: 50,
                height: 32,
                ...(themeType === THEME_TYPES.DARK
                  ? { backgroundColor: theme.tertiaryBackground }
                  : {})
              }}
            />
            <FilterButton
              value="favorites"
              active={predefinedFilter === 'favorites'}
              onPress={handleSelectPredefinedFilter}
              icon={<StarIcon isFilled={predefinedFilter === 'favorites'} />}
            />
            <FilterButton
              value="connected"
              active={predefinedFilter === 'connected'}
              onPress={handleSelectPredefinedFilter}
              icon={<ConnectedIcon />}
            />
          </View>
        </View>
        <ScrollableWrapper
          type={WRAPPER_TYPES.FLAT_LIST}
          contentContainerStyle={[
            spacings.pbTy,
            !!isPopup && spacings.plSm,
            !!isPopup && { paddingRight: SPACING_SM - SPACING_MI / 2 }
          ]}
          data={filteredDapps}
          renderItem={renderItem}
          keyExtractor={(item: Dapp) => item.url.toString()}
          ListEmptyComponent={
            <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
              <Text style={text.center}>{t('No app found')}</Text>
            </View>
          }
        />
      </View>
    </TabLayoutContainer>
  )
}

export default React.memo(DappCatalogScreen)
