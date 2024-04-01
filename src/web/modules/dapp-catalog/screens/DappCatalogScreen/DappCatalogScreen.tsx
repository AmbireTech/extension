import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { View, ViewStyle } from 'react-native'

import BackButton from '@common/components/BackButton'
import ScrollableWrapper, { WRAPPER_TYPES } from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header'
import spacings, { SPACING_MI, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  TabLayoutContainer,
  tabLayoutWidths
} from '@web/components/TabLayoutWrapper/TabLayoutWrapper'
import { Dapp } from '@web/extension-services/background/controllers/dapps'
import useDappsControllerState from '@web/hooks/useDappsControllerState'
import { AnimatedPressable, useMultiHover } from '@web/hooks/useHover'
import DappItem from '@web/modules/dapp-catalog/components/DappItem'

import getStyles from './styles'

type FilterButtonType = {
  text: string
  active?: boolean
  onPress: () => void
  style: ViewStyle
}

const FilterButton = React.memo(({ text, active, style, onPress }: FilterButtonType) => {
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
      onPress={onPress}
    >
      <Text fontSize={14} color={active ? '#FFF' : theme.secondaryText}>
        {text}
      </Text>
    </AnimatedPressable>
  )
})

const DappCatalogScreen = () => {
  const { control, watch } = useForm({
    defaultValues: {
      search: ''
    }
  })

  const { state } = useDappsControllerState()

  const search = watch('search')

  const filteredDapps = useMemo(
    () => state.dapps.filter((dapp) => dapp.name.toLowerCase().includes(search.toLowerCase())),
    [search, state.dapps]
  )

  const renderItem = ({ item }: { item: Dapp }) => <DappItem {...item} />

  return (
    <TabLayoutContainer
      hideFooterInPopup
      width="xl"
      footer={<BackButton />}
      footerStyle={{ maxWidth: tabLayoutWidths.xl }}
      header={<Header withPopupBackButton mode="title" withAmbireLogo />}
      style={spacings.ph0}
      withHorizontalPadding={false}
    >
      <View style={[flexbox.flex1]}>
        <View style={[spacings.phSm, spacings.pvSm]}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <View style={[flexbox.flex1, spacings.mrLg]}>
              <Search placeholder="Search for dApp" control={control} />
            </View>
            <FilterButton text="all" />
            <FilterButton text="favorites" />
            <FilterButton text="connected" />
          </View>
        </View>
        <ScrollableWrapper
          type={WRAPPER_TYPES.FLAT_LIST}
          contentContainerStyle={[
            spacings.plTy,
            spacings.pbTy,
            { paddingRight: SPACING_TY - SPACING_MI / 2, marginTop: -SPACING_MI }
          ]}
          numColumns={3}
          data={filteredDapps}
          renderItem={renderItem}
          keyExtractor={(item: Dapp) => item.id}
        />
      </View>
    </TabLayoutContainer>
  )
}

export default React.memo(DappCatalogScreen)
