import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ColorValue, View, ViewStyle } from 'react-native'

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
import spacings, { SPACING_MI, SPACING_SM } from '@common/styles/spacings'
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

import DappsSkeletonLoader from '../../components/DappsSkeletonLoader'
import getStyles from './styles'

type FilterButtonType = {
  value: 'favorites' | 'connected'
  icon: React.JSX.Element
  active?: boolean
  onPress: (type: 'favorites' | 'connected') => void
  style?: ViewStyle
  textColor?: ColorValue
  hoveredStyle?: ViewStyle
  hoveredTextColor?: ColorValue
  activeStyle?: ViewStyle
  activeTextColor?: ColorValue
}

const FilterButton = React.memo(
  ({
    value,
    icon,
    active,
    style,
    textColor,
    hoveredStyle,
    hoveredTextColor,
    activeStyle,
    activeTextColor,
    onPress
  }: FilterButtonType) => {
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

    const [bind, animatedStyle, isHovered] = useMultiHover({
      values: buttonColors.filterButton as any
    })

    return (
      <AnimatedPressable
        {...bind}
        style={[
          styles.filterButton,
          animatedStyle,
          isHovered && styles.filterButtonHovered,
          active && styles.filterButtonActive,
          style,
          isHovered && hoveredStyle,
          active && activeStyle
        ]}
        onPress={() => onPress(value)}
      >
        {({ hovered }: any) => (
          <>
            <Text
              fontSize={12}
              weight="medium"
              style={spacings.mrTy}
              color={
                active
                  ? activeTextColor || theme.primaryBackground
                  : hovered
                  ? hoveredTextColor || theme.primary
                  : textColor || theme.secondaryText
              }
            >
              {`${value.charAt(0).toUpperCase()}${value.slice(1)}`}
            </Text>
            {icon}
          </>
        )}
      </AnimatedPressable>
    )
  }
)

const { isPopup } = getUiType()

const DappCatalogScreen = () => {
  const { control, watch, setValue } = useForm({ defaultValues: { search: '' } })
  const { t } = useTranslation()
  const { state } = useDappsControllerState()
  const search = watch('search')
  const debouncedSearch = useDebounce({ value: search, delay: 350 })
  const [initialDAppListState, setInitialDAppListState] = useState<Dapp[]>([])
  const [network, setNetwork] = useState<Network | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [favoritesSelected, setFavoritesSelected] = useState(false)
  const [connectedSelected, setConnectedSelected] = useState(false)
  const { allNetworks } = useNetworksControllerState()
  const { theme, themeType } = useTheme()

  const filteredDapps = useMemo(() => {
    if (!state?.dapps?.length) return []

    return state.dapps.filter((dapp) => {
      const searchMatch =
        !debouncedSearch ||
        dapp.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        dapp.url.toLowerCase().includes(debouncedSearch.toLowerCase())

      const networkMatch = !network || dapp.chainIds?.includes(Number(network.chainId))
      const categoryMatch = !category || dapp.category?.toLowerCase() === category.toLowerCase()
      const favoritesMatch = !favoritesSelected || dapp.favorite
      const connectedMatch = !connectedSelected || dapp.isConnected

      return searchMatch && networkMatch && categoryMatch && favoritesMatch && connectedMatch
    })
  }, [state.dapps, debouncedSearch, network, category, favoritesSelected, connectedSelected])

  const handleSetNetworkValue = useCallback(
    (networkOption: SelectValue) => {
      if (networkOption.value === 'all') {
        setNetwork(null)
        return
      }
      setNetwork(allNetworks.filter((n) => n.name === networkOption.value)[0])
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
      icon: <NetworksIcon width={17} height={17} color={theme.iconPrimary} />
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
        icon: <NetworkIcon size={18} key={n.chainId.toString()} id={n.chainId.toString()} />
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
      {state.isUpdatingDapps ? (
        <DappsSkeletonLoader />
      ) : (
        <View style={[flexbox.flex1]}>
          <View style={[!!isPopup && spacings.phSm, spacings.pvSm]}>
            <Search
              placeholder={t('Search for an app')}
              control={control}
              // @ts-ignore
              setValue={setValue}
              autoFocus
              containerStyle={spacings.mbTy}
            />
            <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween]}>
              <Select
                setValue={handleSetNetworkValue}
                containerStyle={{ width: 164, marginBottom: 0 }}
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
                  backgroundColor: theme.primaryBackground,
                  borderWidth: 1,
                  ...(network && network.name !== ALL_CATEGORIES_OPTION.value
                    ? {
                        borderColor:
                          themeType === THEME_TYPES.DARK ? theme.primary : theme.primaryLight
                      }
                    : {})
                }}
                hoveredSelectStyle={{
                  backgroundColor: theme.secondaryBackground,
                  borderColor: themeType === THEME_TYPES.DARK ? theme.primary : theme.primaryLight
                }}
              />
              <Select
                setValue={handleSetCategoryValue}
                containerStyle={{ width: 164, marginBottom: 0 }}
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
                  backgroundColor: theme.primaryBackground,
                  borderWidth: 1,
                  ...(category && category !== ALL_CATEGORIES_OPTION.value
                    ? {
                        borderColor:
                          themeType === THEME_TYPES.DARK ? theme.primary : theme.primaryLight
                      }
                    : {})
                }}
                hoveredSelectStyle={{
                  backgroundColor: theme.secondaryBackground,
                  borderColor: themeType === THEME_TYPES.DARK ? theme.primary : theme.primaryLight
                }}
              />
              <FilterButton
                value="favorites"
                active={favoritesSelected}
                onPress={handleSelectPredefinedFilter}
                icon={<StarIcon isFilled={favoritesSelected} />}
              />
              <FilterButton
                value="connected"
                active={connectedSelected}
                onPress={handleSelectPredefinedFilter}
                icon={
                  <ConnectedIcon
                    width={18}
                    height={18}
                    color={connectedSelected ? theme.primaryBackground : theme.successDecorative}
                  />
                }
                hoveredStyle={{ borderColor: theme.successDecorative }}
                hoveredTextColor={theme.successDecorative}
                activeStyle={{
                  borderColor: themeType === THEME_TYPES.DARK ? theme.primary : theme.primaryLight
                }}
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
      )}
    </TabLayoutContainer>
  )
}

export default React.memo(DappCatalogScreen)
