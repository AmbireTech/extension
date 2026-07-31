import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { SelectValue } from '@common/components/Select/types'
import AddTokenBottomSheet from '@common/modules/settings/components/AddTokenBottomSheet'
import useManageTokens, {
  ALL_NETWORKS_FILTER
} from '@common/modules/settings/hooks/useManageTokens'
import flexbox from '@common/styles/utils/flexbox'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import Filters from './Filters'
import Header from './Header'
import TokenSection from './TokenSection'

const ManageTokensSettingsScreen = () => {
  const {
    ref: addTokenBottomSheetRef,
    open: openAddTokenBottomSheet,
    close: closeAddTokenBottomSheet
  } = useModalize()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { control, watch } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const [networkFilter, setNetworkFilter] = useState(ALL_NETWORKS_FILTER)
  const search = watch('search')
  const { customTokens, hiddenTokens, isLoading, onTokenPreferenceOrCustomTokenChange } =
    useManageTokens({ search, networkFilter })

  useEffect(() => {
    setCurrentSettingsPage('manage-tokens')
  }, [setCurrentSettingsPage])

  const setNetworkFilterValue = useCallback(({ value }: SelectValue) => {
    if (typeof value !== 'string') return
    setNetworkFilter(value)
  }, [])

  const handleCloseAddTokenBottomSheet = useCallback(() => {
    closeAddTokenBottomSheet()
  }, [closeAddTokenBottomSheet])

  return (
    <View style={flexbox.flex1}>
      <AddTokenBottomSheet
        sheetRef={addTokenBottomSheetRef}
        handleClose={handleCloseAddTokenBottomSheet}
      />
      <Header openAddTokenBottomSheet={openAddTokenBottomSheet} />
      <Filters
        control={control}
        networkFilter={networkFilter}
        setNetworkFilterValue={setNetworkFilterValue}
      />
      <ScrollableWrapper>
        <TokenSection
          variant="custom"
          isLoading={isLoading}
          data={customTokens}
          onTokenPreferenceOrCustomTokenChange={onTokenPreferenceOrCustomTokenChange}
          networkFilter={networkFilter}
          search={search}
        />
        <TokenSection
          variant="hidden"
          isLoading={isLoading}
          data={hiddenTokens}
          onTokenPreferenceOrCustomTokenChange={onTokenPreferenceOrCustomTokenChange}
          networkFilter={networkFilter}
          search={search}
        />
      </ScrollableWrapper>
    </View>
  )
}

export default ManageTokensSettingsScreen
