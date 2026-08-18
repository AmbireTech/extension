import React, { useCallback, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { Network } from '@ambire-common/interfaces/network'
import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
import NetworksIcon from '@common/assets/svg/NetworksIcon'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Search from '@common/components/Search'
import Select from '@common/components/Select'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import AddTokenBottomSheet from '@common/modules/settings/components/AddTokenBottomSheet'
import useManageTokens, {
  ALL_NETWORKS_FILTER
} from '@common/modules/settings/hooks/useManageTokens'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'

import TokenSection from './TokenSection'

const FILTERS_HEIGHT = 40

const ManageTokensSettingsScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    ref: addTokenBottomSheetRef,
    open: openAddTokenBottomSheet,
    close: closeAddTokenBottomSheet
  } = useModalize()
  const { networks } = useController('NetworksController').state
  const { control, watch } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const [networkFilter, setNetworkFilter] = useState(ALL_NETWORKS_FILTER)
  const search = watch('search')
  const { customTokens, hiddenTokens, isLoading, onTokenPreferenceOrCustomTokenChange } =
    useManageTokens({ search, networkFilter })

  const allNetworksOption: SelectValue = useMemo(
    () => ({
      value: ALL_NETWORKS_FILTER,
      label: (
        <Text weight="medium" fontSize={12} numberOfLines={1}>
          {t('All networks')}
        </Text>
      ),
      icon: <NetworksIcon width={24} height={24} />
    }),
    [t]
  )

  const networksOptions: SelectValue[] = useMemo(
    () => [
      allNetworksOption,
      ...networks.map((network: Network) => ({
        value: network.name,
        label: (
          <Text weight="medium" fontSize={12} numberOfLines={1}>
            {network.name}
          </Text>
        ),
        icon: (
          <NetworkIcon size={24} key={network.chainId.toString()} id={network.chainId.toString()} />
        )
      }))
    ],
    [allNetworksOption, networks]
  )

  const setNetworkFilterValue = useCallback(({ value }: SelectValue) => {
    if (typeof value !== 'string') return

    setNetworkFilter(value)
  }, [])

  const clearNetworkFilter = useCallback(() => setNetworkFilter(ALL_NETWORKS_FILTER), [])

  const hasNoTokens = !isLoading && !customTokens.length && !hiddenTokens.length

  return (
    <MobileLayoutContainer
      footer={
        <Button
          testID="add-custom-token-button"
          text={t('Add custom token')}
          size="regular"
          onPress={openAddTokenBottomSheet as any}
          childrenPosition="left"
          hasBottomSpacing={false}
          style={{ ...flexbox.alignSelfCenter, width: '100%' }}
        >
          <AddCircularIcon width={24} height={24} color="#fff" style={spacings.mrTy} />
        </Button>
      }
    >
      <MobileLayoutWrapperMainContent withBackButton title={t('Custom and hidden tokens')}>
        <Search
          testID="search-tokens-input"
          placeholder={t('Search tokens')}
          control={control}
          height={FILTERS_HEIGHT}
          containerStyle={spacings.mbTy}
        />
        <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
          <Select
            setValue={setNetworkFilterValue}
            options={networksOptions}
            value={
              networksOptions.find((option) => option.value === networkFilter) ?? allNetworksOption
            }
            clearValue={clearNetworkFilter}
            withClearButton={networkFilter !== ALL_NETWORKS_FILTER}
            size="sm"
            menuOptionHeight={38}
            menuProps={{ width: 200 }}
            containerStyle={{ flexShrink: 1, marginBottom: 0 }}
            selectBorderWrapperStyle={{ borderRadius: FILTERS_HEIGHT + 2 }}
            selectStyle={{
              borderRadius: FILTERS_HEIGHT + 2,
              height: FILTERS_HEIGHT,
              ...spacings.prSm,
              // Matches the search input's left icon inset, so both icons align
              ...spacings.plSm,
              backgroundColor: theme.secondaryBackground
            }}
            bottomSheetTitle={t('Select network')}
          />
        </View>
        <ScrollableWrapper style={flexbox.flex1}>
          {(isLoading || !!customTokens.length) && (
            <TokenSection
              variant="custom"
              isLoading={isLoading}
              data={customTokens}
              onTokenPreferenceOrCustomTokenChange={onTokenPreferenceOrCustomTokenChange}
            />
          )}
          {(isLoading || !!hiddenTokens.length) && (
            <TokenSection
              variant="hidden"
              isLoading={isLoading}
              data={hiddenTokens}
              onTokenPreferenceOrCustomTokenChange={onTokenPreferenceOrCustomTokenChange}
            />
          )}
          {hasNoTokens && (
            <Text
              testID="you-dont-have-any-text"
              appearance="secondaryText"
              fontSize={14}
              style={[spacings.pvXl, text.center]}
            >
              {search || networkFilter !== ALL_NETWORKS_FILTER
                ? t('No custom or hidden tokens found')
                : t("You don't have any custom or hidden tokens")}
            </Text>
          )}
        </ScrollableWrapper>
        <AddTokenBottomSheet
          sheetRef={addTokenBottomSheetRef}
          handleClose={closeAddTokenBottomSheet}
        />
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(ManageTokensSettingsScreen)
