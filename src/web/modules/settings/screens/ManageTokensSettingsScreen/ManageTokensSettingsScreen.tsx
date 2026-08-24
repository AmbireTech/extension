import React, { useCallback, useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { SelectValue } from '@common/components/Select/types'
import AddNftBottomSheet from '@common/modules/settings/components/AddNftBottomSheet'
import AssetTabs, { AssetTab } from '@common/modules/settings/components/AssetTabs'
import AddTokenBottomSheet from '@common/modules/settings/components/AddTokenBottomSheet'
import useManageNfts from '@common/modules/settings/hooks/useManageNfts'
import useManageTokens, {
  ALL_NETWORKS_FILTER
} from '@common/modules/settings/hooks/useManageTokens'
import flexbox from '@common/styles/utils/flexbox'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import AssetSection from './AssetSection'
import Filters from './Filters'
import Header from './Header'

const ManageTokensSettingsScreen = () => {
  const {
    ref: addTokenBottomSheetRef,
    open: openAddTokenBottomSheet,
    close: closeAddTokenBottomSheet
  } = useModalize()
  const {
    ref: addNftBottomSheetRef,
    open: openAddNftBottomSheet,
    close: closeAddNftBottomSheet
  } = useModalize()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { control, watch } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const [networkFilter, setNetworkFilter] = useState(ALL_NETWORKS_FILTER)
  const [activeTab, setActiveTab] = useState<AssetTab>('tokens')
  const search = watch('search')
  const { customTokens, hiddenTokens, isLoading, onTokenPreferenceOrCustomTokenChange } =
    useManageTokens({ search, networkFilter })
  const {
    customCollections,
    hiddenCollections,
    isLoading: areNftsLoading,
    onCollectionPreferenceOrCustomCollectionChange
  } = useManageNfts({ search, networkFilter })

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

  const handleCloseAddNftBottomSheet = useCallback(() => {
    closeAddNftBottomSheet()
  }, [closeAddNftBottomSheet])

  const openAddAssetBottomSheet = useCallback(() => {
    if (activeTab === 'nfts') {
      openAddNftBottomSheet()
      return
    }

    openAddTokenBottomSheet()
  }, [activeTab, openAddNftBottomSheet, openAddTokenBottomSheet])

  return (
    <View style={flexbox.flex1}>
      <AddTokenBottomSheet
        sheetRef={addTokenBottomSheetRef}
        handleClose={handleCloseAddTokenBottomSheet}
      />
      <AddNftBottomSheet
        sheetRef={addNftBottomSheetRef}
        handleClose={handleCloseAddNftBottomSheet}
      />
      <Header />
      <AssetTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <Filters
        control={control}
        networkFilter={networkFilter}
        setNetworkFilterValue={setNetworkFilterValue}
        activeTab={activeTab}
        openAddAssetBottomSheet={openAddAssetBottomSheet}
      />
      <ScrollableWrapper>
        {activeTab === 'tokens' ? (
          <>
            <AssetSection
              standard="ERC20"
              variant="custom"
              isLoading={isLoading}
              data={customTokens}
              onAssetPreferenceChange={onTokenPreferenceOrCustomTokenChange}
              networkFilter={networkFilter}
              search={search}
            />
            <AssetSection
              standard="ERC20"
              variant="hidden"
              isLoading={isLoading}
              data={hiddenTokens}
              onAssetPreferenceChange={onTokenPreferenceOrCustomTokenChange}
              networkFilter={networkFilter}
              search={search}
            />
          </>
        ) : (
          <>
            <AssetSection
              standard="ERC721"
              variant="custom"
              isLoading={areNftsLoading}
              data={customCollections}
              onAssetPreferenceChange={onCollectionPreferenceOrCustomCollectionChange}
              networkFilter={networkFilter}
              search={search}
            />
            <AssetSection
              standard="ERC721"
              variant="hidden"
              isLoading={areNftsLoading}
              data={hiddenCollections}
              onAssetPreferenceChange={onCollectionPreferenceOrCustomCollectionChange}
              networkFilter={networkFilter}
              search={search}
            />
          </>
        )}
      </ScrollableWrapper>
    </View>
  )
}

export default ManageTokensSettingsScreen
