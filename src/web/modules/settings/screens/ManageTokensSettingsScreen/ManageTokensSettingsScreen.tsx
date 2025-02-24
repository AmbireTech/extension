import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { TokenResult } from '@ambire-common/libs/portfolio'
import { TokenPreference } from '@ambire-common/libs/portfolio/customToken'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { tokenSearch } from '@common/utils/search'
import { networkSort } from '@common/utils/sorting'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'
import { getTokenId } from '@web/utils/token'

import AddTokenBottomSheet from './AddTokenBottomSheet'
import Filters from './Filters'
import Header from './Header'
import Skeletons from './Skeletons'
import Token from './Token'
import TokenListHeader from './TokenListHeader'

const ManageTokensSettingsScreen = () => {
  const debouncedPortfolioUpdateInterval = useRef<NodeJS.Timeout | null>(null)
  const {
    ref: addTokenBottomSheetRef,
    open: openAddTokenBottomSheet,
    close: closeAddTokenBottomSheet
  } = useModalize()
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)
  const { control, watch } = useForm({ mode: 'all', defaultValues: { search: '' } })
  const { networks } = useNetworksControllerState()
  const { tokenPreferences } = usePortfolioControllerState()
  const {
    portfolio: { isAllReady, tokens }
  } = useSelectedAccountControllerState()
  const [displaySelectedAccountTokens, setDisplaySelectedAccountTokens] = useState(false)
  const [networkFilter, setNetworkFilter] = useState('all')
  const search = watch('search')
  // Instead of waiting for the portfolio to update remove the token immediately
  const [optimisticRemovedTokens, setOptimisticRemovedTokens] = useState<
    Pick<TokenResult, 'address' | 'networkId'>[]
  >([])
  // Prevent list reordering and tokens being removed while the user
  // is changing the visibility of tokens
  const [initialTokenPreferences, setInitialTokenPreferences] = useState<TokenPreference[] | null>(
    null
  )

  useEffect(() => {
    // Filter and sort using the initial lists to avoid re-ordering
    // the list changes
    if (!initialTokenPreferences) {
      setInitialTokenPreferences(tokenPreferences)
    }
  }, [initialTokenPreferences, tokenPreferences])

  useEffect(() => {
    setCurrentSettingsPage('manage-tokens')
  }, [setCurrentSettingsPage])

  const customOrHiddenTokens = useMemo(() => {
    return (
      tokens
        .filter(({ flags, networkId, address, amount }) => {
          if (flags.onGasTank || !!flags.rewardsType) return false
          if (networkFilter !== 'all' && networkId !== networkFilter) return false

          const isRemoved = optimisticRemovedTokens.some(
            ({ address: addr, networkId: nId }) => addr === address && nId === networkId
          )
          if (isRemoved) return false

          const initialIsHidden = initialTokenPreferences?.find(
            ({ address: addr, networkId: nId }) => addr === address && nId === networkId
          )?.isHidden

          return flags.isCustom || !!initialIsHidden || (displaySelectedAccountTokens && amount)
        })
        // Filter by search
        .filter((token) => tokenSearch({ search, token, networks }))
        // Sort by custom, then visibility, then network
        .sort((a, b) => {
          const isACustom = a.flags.isCustom
          const isBCustom = b.flags.isCustom

          if (isACustom && !isBCustom) return -1
          if (!isACustom && isBCustom) return 1

          const aInitialIsHidden = initialTokenPreferences?.find(
            ({ address: addr, networkId: nId }) => addr === a.address && nId === a.networkId
          )?.isHidden
          const bInitialIsHidden = initialTokenPreferences?.find(
            ({ address: addr, networkId: nId }) => addr === b.address && nId === b.networkId
          )?.isHidden

          if (!aInitialIsHidden && bInitialIsHidden) return -1
          if (aInitialIsHidden && !bInitialIsHidden) return 1

          const aNetwork = networks.find(({ id }) => id === a.networkId)
          const bNetwork = networks.find(({ id }) => id === b.networkId)

          if (!aNetwork || !bNetwork) return 0

          return networkSort(aNetwork, bNetwork, networks)
        })
    )
  }, [
    displaySelectedAccountTokens,
    initialTokenPreferences,
    networkFilter,
    networks,
    optimisticRemovedTokens,
    search,
    tokens
  ])

  const isLoading = useMemo(
    () => !isAllReady || !initialTokenPreferences,
    [initialTokenPreferences, isAllReady]
  )

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

  const onTokenRemove = useCallback(
    ({ address, networkId }: Pick<TokenResult, 'address' | 'networkId'>) => {
      setOptimisticRemovedTokens((prev) => [...prev, { address, networkId }])
    },
    []
  )

  const emptyText = useMemo(() => {
    const prefix = displaySelectedAccountTokens ? '' : 'custom or hidden '
    const hasNetworkFilter = networkFilter !== 'all'

    if (search && hasNetworkFilter) {
      return t(`No ${prefix}tokens found for these filters`)
    }

    if (!search && !hasNetworkFilter) {
      return t(`You don't have any ${prefix}tokens`)
    }

    if (search && !hasNetworkFilter) {
      return t(`No ${prefix}tokens found`)
    }

    if (!search && hasNetworkFilter) {
      return t(`No ${prefix}tokens found on this network`)
    }

    return t(`No ${prefix}tokens found`)
  }, [displaySelectedAccountTokens, networkFilter, search, t])

  const handleCloseAddTokenBottomSheet = useCallback(() => {
    setOptimisticRemovedTokens([])
    closeAddTokenBottomSheet()
  }, [closeAddTokenBottomSheet])

  const handleUpdateDisplaySelectedAccountTokens = useCallback(
    (value: boolean) => {
      setDisplaySelectedAccountTokens(value)
      // The user may have hidden tokens and then decided to display
      // only custom and hidden tokens. In this case, we need to update
      // the initial token preferences
      setInitialTokenPreferences(tokenPreferences)
    },
    [tokenPreferences]
  )

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
        displaySelectedAccountTokens={displaySelectedAccountTokens}
        handleUpdateDisplaySelectedAccountTokens={handleUpdateDisplaySelectedAccountTokens}
      />
      <TokenListHeader />
      <ScrollView style={flexbox.flex1}>
        {!isLoading && initialTokenPreferences && !customOrHiddenTokens.length && (
          <Text
            appearance="secondaryText"
            fontSize={16}
            style={[spacings.mt2Xl, text.center]}
            weight="medium"
          >
            {emptyText}
          </Text>
        )}
        {!isLoading &&
          initialTokenPreferences &&
          !!customOrHiddenTokens.length &&
          customOrHiddenTokens.map((token) => (
            <Token
              key={getTokenId(token)}
              onTokenPreferenceOrCustomTokenChange={onTokenPreferenceOrCustomTokenChange}
              onTokenRemove={onTokenRemove}
              {...token}
            />
          ))}
        {isLoading && <Skeletons />}
      </ScrollView>
    </View>
  )
}

export default ManageTokensSettingsScreen
