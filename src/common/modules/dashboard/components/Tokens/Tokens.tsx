import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Animated, FlatListProps, View } from 'react-native'

import { PINNED_TOKENS } from '@ambire-common/consts/pinnedTokens'
import { Network } from '@ambire-common/interfaces/network'
import { AssetType } from '@ambire-common/libs/defiPositions/types'
import { PORTFOLIO_LIB_ERROR_NAMES } from '@ambire-common/libs/portfolio/errorNames'
import { getTokenAmount, getTokenBalanceInUSD } from '@ambire-common/libs/portfolio/helpers'
import { TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import spacings from '@common/styles/spacings'
import { tokenOrCollectionSearch } from '@common/utils/search'
import { getTokenId } from '@common/utils/token'
import { getUiType } from '@common/utils/uiType'

import DashboardBanners from '../DashboardBanners'
import DashboardPageScrollContainer from '../DashboardPageScrollContainer'
import FloatingBottomBar from '../FloatingBottomBar'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import HiddenTokensFooter from './HiddenTokensFooter'
import OtherTokensSummary from './OtherTokensSummary'
import TokenItem from './TokenItem'
import TokensEmptyState from './TokensEmptyState'
import TokensListHeader from './TokensListHeader'
import Skeleton from './TokensSkeleton'

import type { NetworksController } from '@ambire-common/controllers/networks/networks'
import type { PortfolioController } from '@ambire-common/controllers/portfolio/portfolio'
import type { SelectedAccountController } from '@ambire-common/controllers/selectedAccount/selectedAccount'

const selectNetworks = (state: NetworksController) => state.networks
const selectCustomTokens = (state: PortfolioController) => state.customTokens
const selectPortfolio = (state: SelectedAccountController) => state.portfolio
const selectBalanceAffectingErrors = (state: SelectedAccountController) =>
  state.balanceAffectingErrors
const selectDashboardNetworkFilter = (state: SelectedAccountController) =>
  state.dashboardNetworkFilter

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  sessionId: string
  initTab?: {
    [key: string]: boolean
  }
  onScroll: FlatListProps<any>['onScroll']
  dashboardNetworkFilterName: string | null
  animatedOverviewHeight: Animated.Value
  isSearchHidden: boolean
  refreshing?: boolean
  onRefresh?: () => void
}

// if any of the post amount (during simulation) or the current state
// has a balance above 0, we should consider it legit and show it
const hasAmount = (token: TokenResult) => {
  return (
    (token.amount > 0n || (token.amountPostSimulation && token.amountPostSimulation > 0n)) &&
    !token.flags.isHidden
  )
}
// if the token is on the gas tank and the network is not a relayer network (a custom network)
// we should not show it on dashboard
const isGasTankTokenOnCustomNetwork = (token: TokenResult, networks: Network[]) => {
  return token.flags.onGasTank && !networks.find((n) => n.chainId === token.chainId && n.hasRelayer)
}

const HIGH_VALUE_TOKEN_USD = 1
const HIGH_VALUE_TOKEN_COUNT_THRESHOLD = 100
const LOWER_VALUE_TOKEN_MAX_USD = 1
const DUST_TOKEN_MAX_USD = 0.01
const SEARCH_DEBOUNCE_MS = 200

const hasUSDPrice = (token: TokenResult) =>
  token.priceIn.some((price) => price.baseCurrency === 'usd')

const PINNED_TOKEN_KEYS = new Set(
  PINNED_TOKENS.map(({ address, chainId }) => getTokenId({ address, chainId }))
)

const isCollapsibleToken = (
  token: TokenResult,
  balanceUSD: number,
  isLargePortfolio: boolean
): boolean => {
  // Rewards and vesting tokens should never be hidden as lower-value tokens
  if (
    token.flags.rewardsType === 'wallet-rewards' ||
    token.flags.rewardsType === 'wallet-vesting'
  ) {
    return false
  }

  // Simulated tokens should never be hidden as well, because the user may be
  // sending the entire amount, which will make the post-simulation balance 0
  if (typeof token.amountPostSimulation === 'bigint') {
    return false
  }

  const tokenHasUSDPrice = hasUSDPrice(token)

  // Custom tokens that don't have a price shouldn't be hidden as lower-value tokens
  // because the user may be tracking it for other reasons
  if (token.flags.isCustom && !tokenHasUSDPrice) {
    return false
  }

  if (!tokenHasUSDPrice) {
    return true
  }

  if (isLargePortfolio) {
    return balanceUSD <= LOWER_VALUE_TOKEN_MAX_USD
  }

  return balanceUSD < DUST_TOKEN_MAX_USD
}

const { isPopup } = getUiType()

const Tokens = ({
  openTab,
  setOpenTab,
  initTab,
  sessionId,
  onScroll,
  animatedOverviewHeight,
  dashboardNetworkFilterName,
  isSearchHidden,
  refreshing,
  onRefresh
}: Props) => {
  const { t } = useTranslation()
  const { state: networks } = useController('NetworksController', selectNetworks)
  const { state: customTokens } = useController('PortfolioController', selectCustomTokens)
  const { state: portfolio } = useController('SelectedAccountController', selectPortfolio)
  const { state: balanceAffectingErrors } = useController(
    'SelectedAccountController',
    selectBalanceAffectingErrors
  )
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )
  const { control, watch, setValue } = useForm({
    mode: 'all',
    defaultValues: {
      search: ''
    }
  })

  const [isDustExpanded, setIsDustExpanded] = useState(false)
  const inputSearchValue = watch('search')
  // Debounced so a keystroke doesn't rebuild the search index
  const searchValue = useDebounce({ value: inputSearchValue, delay: SEARCH_DEBOUNCE_MS })

  const networkIdsWithPriceError = useMemo(() => {
    const networkIds = new Set<string>()

    const priceError = balanceAffectingErrors.find(
      (error) => error.id === PORTFOLIO_LIB_ERROR_NAMES.PriceFetchError
    )

    priceError?.networkNames.forEach((networkName) => {
      const network = networks.find((n) => n.name === networkName)

      if (network) {
        networkIds.add(network.chainId.toString())
      }
    })
    return networkIds
  }, [balanceAffectingErrors, networks])

  const tokens = useMemo(() => {
    const tokenList = (portfolio?.tokens || []).filter((token) => {
      // Hide gas tank and borrowed defi tokens from the list
      if (token.flags.onGasTank || token.flags.defiTokenType === AssetType.Borrow) return false

      if (!dashboardNetworkFilter) return true
      if (dashboardNetworkFilter === 'rewards') return token.flags.rewardsType
      if (dashboardNetworkFilter === 'gasTank') return token.flags.onGasTank

      return token?.chainId?.toString() === dashboardNetworkFilter.toString()
    })

    return tokenOrCollectionSearch({ networks, assets: tokenList, search: searchValue })
  }, [portfolio?.tokens, networks, searchValue, dashboardNetworkFilter])

  const userHasNoBalance = useMemo(
    // Exclude gas tank tokens from the check
    // as new users get some Gas Tank balance by default
    () => !tokens.some((token) => !token.flags.onGasTank && hasAmount(token)),
    [tokens]
  )

  const balancesInUSD = useMemo(() => {
    const balances = new Map<TokenResult, number>()

    tokens.forEach((token) => balances.set(token, getTokenBalanceInUSD(token)))

    return balances
  }, [tokens])

  const customTokenKeys = useMemo(
    () => new Set(customTokens.map(({ address, chainId }) => getTokenId({ address, chainId }))),
    [customTokens]
  )

  const sortedTokens = useMemo(() => {
    const visible = tokens.filter((token) => {
      if (isGasTankTokenOnCustomNetwork(token, networks)) return false
      if (token?.flags.isHidden || token.flags.rewardsType === 'wallet-projected-rewards')
        return false

      const tokenKey = getTokenId(token)
      // exclude rewards from custom tokens
      const isCustom = customTokenKeys.has(tokenKey) && !token.flags.rewardsType
      // projected rewards are already filtered out by the guard above
      const isPinned = PINNED_TOKEN_KEYS.has(tokenKey)

      return (
        hasAmount(token) ||
        isCustom ||
        // Don't display pinned tokens until we are sure the user has no balance
        (isPinned && userHasNoBalance && portfolio?.isAllReady)
      )
    })

    const decorated = visible.map((token) => ({
      token,
      balanceUSD: balancesInUSD.get(token) ?? 0,
      amount: Number(getTokenAmount(token)),
      isSimulated:
        typeof token.amountPostSimulation === 'bigint' &&
        token.amountPostSimulation !== BigInt(token.amount),
      rewardsType: token.flags.rewardsType,
      onGasTank: token.flags.onGasTank
    }))

    decorated.sort((a, b) => {
      // pending tokens go on top
      if (a.isSimulated !== b.isSimulated) return a.isSimulated ? -1 : 1

      // rewards tokens come before regular ones
      if (!a.rewardsType !== !b.rewardsType) return a.rewardsType ? -1 : 1

      if (a.rewardsType === b.rewardsType) {
        if (a.balanceUSD === b.balanceUSD) return b.amount - a.amount

        return b.balanceUSD - a.balanceUSD
      }

      if (a.onGasTank !== b.onGasTank) return a.onGasTank ? -1 : 1

      return 0
    })

    return decorated.map(({ token }) => token)
  }, [tokens, networks, customTokenKeys, userHasNoBalance, portfolio?.isAllReady, balancesInUSD])

  const { visibleTokens, dustTokens } = useMemo(() => {
    if (userHasNoBalance || searchValue.length > 0) {
      return { visibleTokens: sortedTokens, dustTokens: [] }
    }

    const highValueTokensCount = sortedTokens.filter(
      (token) => hasUSDPrice(token) && (balancesInUSD.get(token) ?? 0) > HIGH_VALUE_TOKEN_USD
    ).length

    const isLargePortfolio = highValueTokensCount > HIGH_VALUE_TOKEN_COUNT_THRESHOLD

    return sortedTokens.reduce(
      (acc, token) => {
        // If there is a price fetch error for a network every token will be considered
        // lower-value, so we need to show all tokens in that case, regardless of their balance
        if (
          isCollapsibleToken(token, balancesInUSD.get(token) ?? 0, isLargePortfolio) &&
          !networkIdsWithPriceError.has(token.chainId.toString())
        ) {
          acc.dustTokens.push(token)
        } else {
          acc.visibleTokens.push(token)
        }
        return acc
      },
      { visibleTokens: [] as TokenResult[], dustTokens: [] as TokenResult[] }
    )
  }, [networkIdsWithPriceError, sortedTokens, userHasNoBalance, searchValue, balancesInUSD])

  const dustTotalUSD = useMemo(
    () => dustTokens.reduce((sum, token) => sum + (balancesInUSD.get(token) ?? 0), 0),
    [dustTokens, balancesInUSD]
  )

  const hiddenTokensCount = useMemo(
    () => tokens.filter((token) => token.flags.isHidden).length,
    [tokens]
  )

  const showTokens = initTab?.tokens
  const hasAnyTokens = visibleTokens.length > 0 || dustTokens.length > 0

  const listData = useMemo(() => {
    const data: any[] = ['header']

    // Skeleton 1, order matters
    if (!hasAnyTokens && !portfolio?.isAllReady) {
      data.push('skeleton')
    }

    if (showTokens) {
      data.push(...visibleTokens)

      if (dustTokens.length > 0) {
        if (!isDustExpanded) {
          data.push('dust-summary')
        } else {
          data.push(...dustTokens, 'dust-collapse')
        }
      }
    }

    // Skeleton 2, order matters, needs to be after the tokens to show the user partial results
    // but also indicate that we are still loading
    if (hasAnyTokens && !portfolio?.isAllReady) {
      data.push('skeleton')
    }

    if (portfolio?.isAllReady && !hasAnyTokens) {
      data.push('empty')
    }

    if (portfolio?.isAllReady) {
      data.push('footer')
    }

    return data
  }, [hasAnyTokens, portfolio?.isAllReady, showTokens, visibleTokens, dustTokens, isDustExpanded])

  const expandDust = useCallback(() => setIsDustExpanded(true), [])
  const collapseDust = useCallback(() => setIsDustExpanded(false), [])

  const renderItem = useCallback(
    ({ item }: any) => {
      if (item === 'header') {
        return <TokensListHeader openTab={openTab} setOpenTab={setOpenTab} sessionId={sessionId} />
      }

      if (item === 'empty') {
        return (
          <TokensEmptyState
            searchValue={searchValue}
            dashboardNetworkFilterName={dashboardNetworkFilterName}
          />
        )
      }

      if (item === 'skeleton')
        return (
          <View style={spacings.ptTy}>
            {/* Display more skeleton items if there are no tokens */}
            <Skeleton amount={3} />
          </View>
        )

      // Always the last entry in listData, so it renders once all tokens are
      // laid out and doesn't cause a layout shift
      if (item === 'footer') {
        return (
          <HiddenTokensFooter
            hiddenTokensCount={hiddenTokensCount}
            isNetworkFiltered={!!dashboardNetworkFilter}
          />
        )
      }

      if (item === 'dust-summary') {
        return (
          <OtherTokensSummary
            variant="summary"
            count={dustTokens.length}
            totalUSD={dustTotalUSD}
            onPress={expandDust}
          />
        )
      }

      if (item === 'dust-collapse') {
        return (
          <OtherTokensSummary variant="collapse" count={dustTokens.length} onPress={collapseDust} />
        )
      }

      if (!initTab?.tokens || !item) return null

      return <TokenItem token={item} />
    },
    [
      initTab?.tokens,
      openTab,
      setOpenTab,
      sessionId,
      searchValue,
      dashboardNetworkFilterName,
      hiddenTokensCount,
      dashboardNetworkFilter,
      dustTokens.length,
      dustTotalUSD,
      expandDust,
      collapseDust
    ]
  )

  const keyExtractor = useCallback((tokenOrElement: any) => {
    if (typeof tokenOrElement === 'string') {
      return tokenOrElement
    }

    return getTokenId(tokenOrElement)
  }, [])

  useEffect(() => {
    setValue('search', '')
  }, [setValue])

  return (
    <>
      <DashboardPageScrollContainer
        tab="tokens"
        openTab={openTab}
        ListHeaderComponent={<DashboardBanners />}
        animatedOverviewHeight={animatedOverviewHeight}
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={isPopup ? 5 : 2.5}
        initialNumToRender={isPopup ? 10 : 20}
        windowSize={9} // Larger values can cause performance issues.
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      {openTab === 'tokens' && (
        <FloatingBottomBar
          control={control}
          displayCurrentApp
          displayNetworkFilter
          isHidden={isSearchHidden}
          searchPlaceholder={t('Search token')}
        />
      )}
    </>
  )
}

export default React.memo(Tokens)
