import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Animated, FlatListProps, Pressable, View } from 'react-native'

import { PINNED_TOKENS } from '@ambire-common/consts/pinnedTokens'
import { Network } from '@ambire-common/interfaces/network'
import { AssetType } from '@ambire-common/libs/defiPositions/types'
import { getTokenAmount, getTokenBalanceInUSD } from '@ambire-common/libs/portfolio/helpers'
import { TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import { PORTFOLIO_LIB_ERROR_NAMES } from '@ambire-common/libs/portfolio/portfolio'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { tokenOrCollectionSearch } from '@common/utils/search'
import { getTokenId } from '@common/utils/token'
import { getUiType } from '@common/utils/uiType'

import DashboardBanners from '../DashboardBanners'
import DashboardPageScrollContainer from '../DashboardPageScrollContainer'
import FloatingBottomBar from '../FloatingBottomBar'
import TabsAndSearch from '../TabsAndSearch'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import DustTokensSummary from './DustTokensSummary'
import TokenItem from './TokenItem'
import Skeleton from './TokensSkeleton'

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
  onAddCustomToken?: () => void
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

const isDustToken = (token: TokenResult): boolean => {
  // Rewards and vesting tokens should never be hidden as dust
  if (
    token.flags.rewardsType === 'wallet-rewards' ||
    token.flags.rewardsType === 'wallet-vesting'
  ) {
    return false
  }

  const balanceUSD = getTokenBalanceInUSD(token)
  const hasUSDPrice = token.priceIn.some((p) => p.baseCurrency === 'usd')

  // Custom tokens that don't have a price shouldn't be hidden as dust
  // because the user may be tracking it for other reasons
  if (token.flags.isCustom && !hasUSDPrice) {
    return false
  }

  return balanceUSD < 0.01 || !hasUSDPrice
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
  onAddCustomToken,
  refreshing,
  onRefresh
}: Props) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const {
    state: { networks }
  } = useController('NetworksController')
  const { customTokens } = useController('PortfolioController').state
  const {
    state: { portfolio, balanceAffectingErrors, dashboardNetworkFilter }
  } = useController('SelectedAccountController')
  const { control, watch, setValue } = useForm({
    mode: 'all',
    defaultValues: {
      search: ''
    }
  })

  const [isDustExpanded, setIsDustExpanded] = useState(false)
  const searchValue = watch('search')

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

  const sortedTokens = useMemo(
    () =>
      tokens
        .filter((token) => {
          if (isGasTankTokenOnCustomNetwork(token, networks)) return false
          if (token?.flags.isHidden || token.flags.rewardsType === 'wallet-projected-rewards')
            return false

          const hasTokenAmount = hasAmount(token)
          const isCustom = customTokens.find(
            ({ address, chainId }) =>
              token.address.toLowerCase() === address.toLowerCase() &&
              token.chainId === chainId &&
              !token.flags.rewardsType // exclude rewards from custom tokens
          )
          const isPinned = PINNED_TOKENS.find(
            ({ address, chainId }) =>
              token.address.toLowerCase() === address.toLowerCase() &&
              token.chainId === chainId &&
              // exclude projected rewards from pinned tokens
              token.flags.rewardsType !== 'wallet-projected-rewards'
          )

          return (
            hasTokenAmount ||
            isCustom ||
            // Don't display pinned tokens until we are sure the user has no balance
            (isPinned && userHasNoBalance && portfolio?.isAllReady)
          )
        })
        .sort((a, b) => {
          // pending tokens go on top
          if (
            typeof a.amountPostSimulation === 'bigint' &&
            a.amountPostSimulation !== BigInt(a.amount)
          ) {
            return -1
          }
          if (
            typeof b.amountPostSimulation === 'bigint' &&
            b.amountPostSimulation !== BigInt(b.amount)
          ) {
            return 1
          }

          // If a is a rewards token and b is not, a should come before b.
          if (a.flags.rewardsType && !b.flags.rewardsType) {
            return -1
          }
          if (!a.flags.rewardsType && b.flags.rewardsType) {
            // If b is a rewards token and a is not, b should come before a.
            return 1
          }

          const aBalance = getTokenBalanceInUSD(a)
          const bBalance = getTokenBalanceInUSD(b)

          if (a.flags.rewardsType === b.flags.rewardsType) {
            if (aBalance === bBalance) {
              return Number(getTokenAmount(b)) - Number(getTokenAmount(a))
            }

            return bBalance - aBalance
          }

          if (a.flags.onGasTank && !b.flags.onGasTank) {
            return -1
          }
          if (!a.flags.onGasTank && b.flags.onGasTank) {
            return 1
          }

          return 0
        }),
    [tokens, networks, customTokens, userHasNoBalance, portfolio?.isAllReady]
  )

  const { visibleTokens, dustTokens } = useMemo(() => {
    if (userHasNoBalance || searchValue.length > 0) {
      return { visibleTokens: sortedTokens, dustTokens: [] }
    }

    return sortedTokens.reduce(
      (acc, token) => {
        // If there is a price fetch error for a network every token will be considered dust, so
        // we need to show all tokens in that case, regardless of their balance
        if (isDustToken(token) && !networkIdsWithPriceError.has(token.chainId.toString())) {
          acc.dustTokens.push(token)
        } else {
          acc.visibleTokens.push(token)
        }
        return acc
      },
      { visibleTokens: [] as TokenResult[], dustTokens: [] as TokenResult[] }
    )
  }, [networkIdsWithPriceError, sortedTokens, userHasNoBalance, searchValue])

  const dustTotalUSD = useMemo(
    () => dustTokens.reduce((sum, token) => sum + getTokenBalanceInUSD(token), 0),
    [dustTokens]
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

  const renderItem = useCallback(
    ({ item, index }: any) => {
      if (item === 'header') {
        return (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            <TabsAndSearch
              openTab={openTab}
              setOpenTab={setOpenTab}
              currentTab="tokens"
              sessionId={sessionId}
            />
          </View>
        )
      }

      if (item === 'empty') {
        return (
          <View style={[flexbox.alignCenter, spacings.pv]}>
            <Text testID="no-tokens-text" fontSize={16} weight="medium">
              {!searchValue && !dashboardNetworkFilterName && t("You don't have any tokens yet.")}
              {!searchValue &&
                dashboardNetworkFilterName &&
                t(`No tokens found on ${dashboardNetworkFilterName}.`)}
              {searchValue &&
                t(
                  `No tokens match "${searchValue}"${
                    dashboardNetworkFilterName ? ` on ${dashboardNetworkFilterName}` : ''
                  }.`
                )}
            </Text>
          </View>
        )
      }

      if (item === 'skeleton')
        return (
          <View style={spacings.ptTy}>
            {/* Display more skeleton items if there are no tokens */}
            <Skeleton amount={3} />
          </View>
        )

      if (item === 'footer') {
        return portfolio?.isAllReady &&
          // A trick to render the button once all tokens have been rendered. Otherwise
          // there will be layout shifts
          index === listData.length - 1 ? (
          <View style={hiddenTokensCount ? spacings.ptTy : spacings.ptSm}>
            {!!hiddenTokensCount && (
              <Pressable
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.justifySpaceBetween,
                  spacings.pvMi,
                  spacings.phTy,
                  spacings.mhTy,
                  spacings.mbLg,
                  {
                    borderRadius: 4,
                    backgroundColor: theme.secondaryBackground
                  }
                ]}
                onPress={() => {
                  navigate(WEB_ROUTES.manageTokens)
                }}
              >
                <Text appearance="secondaryText" fontSize={12}>
                  {t('You have {{count}} hidden {{tokensLabel}}', {
                    count: hiddenTokensCount,
                    tokensLabel: hiddenTokensCount > 1 ? t('tokens') : t('token')
                  })}{' '}
                  {!!dashboardNetworkFilter && t('on this network')}
                </Text>
                <RightArrowIcon height={12} color={theme.secondaryText as string} />
              </Pressable>
            )}
          </View>
        ) : null
      }

      if (item === 'dust-summary') {
        return (
          <DustTokensSummary
            variant="summary"
            count={dustTokens.length}
            totalUSD={dustTotalUSD}
            onPress={() => setIsDustExpanded(true)}
          />
        )
      }

      if (item === 'dust-collapse') {
        return (
          <DustTokensSummary
            variant="collapse"
            count={dustTokens.length}
            onPress={() => setIsDustExpanded(false)}
          />
        )
      }

      if (!initTab?.tokens || !item) return null

      return <TokenItem token={item} />
    },
    [
      initTab?.tokens,
      theme.primaryBackground,
      theme.secondaryBackground,
      theme.secondaryText,
      openTab,
      setOpenTab,
      sessionId,
      searchValue,
      dashboardNetworkFilterName,
      t,
      listData.length,
      hiddenTokensCount,
      portfolio?.isAllReady,
      dashboardNetworkFilter,
      navigate,
      dustTokens.length,
      dustTotalUSD
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
