import React, { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { Network } from '@ambire-common/interfaces/network'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import LayoutWrapper from '@common/components/LayoutWrapper'
import NetworkIcon from '@common/components/NetworkIcon'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import DappItem from '@common/modules/explore/components/DappItem'
import useExploreFilteredDapps from '@common/modules/explore/hooks/useExploreFilteredDapps'
import { ExploreSectionType } from '@common/modules/explore/hooks/useExploreSections'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

const TYPE_TITLES: Record<ExploreSectionType, string> = {
  recent: 'Recent',
  connected: 'Connected',
  favorites: 'Favorites',
  apps: 'Explore apps'
}

const ExploreSectionScreen = () => {
  const { t } = useTranslation()
  const { params } = useRoute()
  const { theme } = useTheme()
  const { state } = useController('DappsController')
  const { networks: allNetworks } = useController('NetworksController').state
  const { control, watch, setValue } = useForm({ defaultValues: { search: '' } })
  const [network, setNetwork] = useState<Network | null>(null)
  const [category, setCategory] = useState<string | null>(null)

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
            backgroundColor: theme.neutral300,
            ...flexbox.center
          }}
        >
          <NetworksIcon width={19} height={19} />
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

  const renderItem = useCallback(({ item }: { item: Dapp }) => <DappItem {...item} />, [])

  return (
    <LayoutWrapper>
      <HeaderWithTitle title={title} />
      <View style={[flexbox.flex1]}>
        <View style={[spacings.pbTy, spacings.phSm]}>
          <Search
            placeholder={t('Search')}
            control={control}
            // @ts-ignore
            setValue={setValue}
            containerStyle={sectionType === 'apps' ? spacings.mbTy : spacings.mb0}
          />
          {sectionType === 'apps' && (
            <View style={[flexbox.directionRow, flexbox.alignCenter, { columnGap: SPACING_SM }]}>
              <View>
                <Select
                  setValue={handleSetNetworkValue}
                  containerStyle={{ marginBottom: 0 }}
                  menuOptionHeight={32}
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
                />
              </View>
              <View>
                <Select
                  setValue={handleSetCategoryValue}
                  containerStyle={{ marginBottom: 0 }}
                  options={categoryOptions}
                  value={
                    categoryOptions.find((opt) => opt.value === category) ?? ALL_CATEGORIES_OPTION
                  }
                  menuOptionHeight={32}
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
                />
              </View>
            </View>
          )}
        </View>
        <ScrollableWrapper
          type={WRAPPER_TYPES.FLAT_LIST}
          data={dapps}
          renderItem={renderItem}
          keyExtractor={(item: Dapp) => item.id}
          style={spacings.phSm}
          contentContainerStyle={spacings.pr0}
          ListEmptyComponent={
            <View style={[flexbox.center, spacings.pv]}>
              <Text appearance="secondaryText" style={text.center}>
                {t('No apps found')}
              </Text>
            </View>
          }
        />
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(ExploreSectionScreen)
