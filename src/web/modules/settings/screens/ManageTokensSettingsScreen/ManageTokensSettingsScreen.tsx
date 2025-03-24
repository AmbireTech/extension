import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { SelectValue } from '@common/components/Select/types'
import flexbox from '@common/styles/utils/flexbox'
import { tokenSearch } from '@common/utils/search'
import { networkSort } from '@common/utils/sorting'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

import AddTokenBottomSheet from './AddTokenBottomSheet'
import Filters from './Filters'
import Header from './Header'
import TokenSection from './TokenSection'

const ManageTokensSettingsScreen = () => {
  const debouncedPortfolioUpdateInterval = useRef<NodeJS.Timeout | null>(null)
  const {
    ref: addTokenBottomSheetRef,
    open: openAddTokenBottomSheet,
    close: closeAddTokenBottomSheet
  } = useModalize()
  const { tokenPreferences, customTokens: portfolioCustomTokens } = usePortfolioControllerState()
  const { dispatch } = useBackgroundService()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { control, watch } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const { networks } = useNetworksControllerState()
  const {
    portfolio: { isAllReady, tokens }
  } = useSelectedAccountControllerState()
  const [networkFilter, setNetworkFilter] = useState('all')
  const search = watch('search')

  useEffect(() => {
    setCurrentSettingsPage('manage-tokens')
  }, [setCurrentSettingsPage])

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const { flags, networkId } = token
      if (flags.onGasTank || !!flags.rewardsType) return false
      if (networkFilter !== 'all' && networkId !== networkFilter) return false

      return tokenSearch({ search, token, networks })
    })
  }, [networkFilter, networks, search, tokens])

  const customTokens = useMemo(() => {
    return filteredTokens
      .filter(({ flags, address, networkId }) => {
        const isTokenHidden =
          tokenPreferences.some(
            ({ address: addr, networkId: nId, isHidden }) =>
              addr === address && nId === networkId && isHidden
          ) && flags.isHidden

        const isCustom = flags.isCustom && !isTokenHidden

        if (!isCustom) return false

        const isRemovedOptimistically = !portfolioCustomTokens.some(
          ({ address: addr, networkId: nId }) => addr === address && nId === networkId
        )

        return !isRemovedOptimistically
      })
      .sort((a, b) => {
        const aNetwork = networks.find(({ id }) => id === a.networkId)
        const bNetwork = networks.find(({ id }) => id === b.networkId)

        if (!aNetwork || !bNetwork) return 0

        return networkSort(aNetwork, bNetwork, networks)
      })
  }, [filteredTokens, networks, portfolioCustomTokens, tokenPreferences])

  const hiddenTokens = useMemo(() => {
    return filteredTokens
      .filter(({ flags, address, networkId }) => {
        return (
          tokenPreferences.some(
            ({ address: addr, networkId: nId, isHidden }) =>
              addr === address && nId === networkId && isHidden
          ) && flags.isHidden
        )
      })
      .sort((a, b) => {
        const aNetwork = networks.find(({ id }) => id === a.networkId)
        const bNetwork = networks.find(({ id }) => id === b.networkId)

        if (!aNetwork || !bNetwork) return 0

        return networkSort(aNetwork, bNetwork, networks)
      })
  }, [filteredTokens, networks, tokenPreferences])

  const setNetworkFilterValue = useCallback(({ value }: SelectValue) => {
    if (typeof value !== 'string') return

    setNetworkFilter(value)
  }, [])

  const onTokenPreferenceOrCustomTokenChange = useCallback(() => {
    if (debouncedPortfolioUpdateInterval.current) {
      clearTimeout(debouncedPortfolioUpdateInterval.current)
    }

    debouncedPortfolioUpdateInterval.current = setTimeout(() => {
      dispatch({
        type: 'MAIN_CONTROLLER_UPDATE_SELECTED_ACCOUNT_PORTFOLIO',
        params: {
          // Update the portfolio for all networks as the user may hide multiple tokens
          // from different networks
          forceUpdate: true
        }
      })
      debouncedPortfolioUpdateInterval.current = null
    }, 1000)
  }, [dispatch])

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
          isLoading={!isAllReady}
          data={customTokens}
          onTokenPreferenceOrCustomTokenChange={onTokenPreferenceOrCustomTokenChange}
          networkFilter={networkFilter}
          search={search}
        />
        <TokenSection
          variant="hidden"
          isLoading={!isAllReady}
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
