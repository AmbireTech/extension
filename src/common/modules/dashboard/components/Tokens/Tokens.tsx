import { formatUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { FlatList, FlatListProps, View } from 'react-native'

import { PINNED_TOKENS } from '@ambire-common/consts/pinnedTokens'
import { NetworkDescriptor } from '@ambire-common/interfaces/networkDescriptor'
import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import { TokenResult } from '@ambire-common/libs/portfolio/interfaces'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import { getUiType } from '@web/utils/uiType'

import DashboardBanners from '../DashboardBanners'
import TabsAndSearch from '../TabsAndSearch'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import TokenItem from './TokenItem'

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  filterByNetworkId: NetworkDescriptor['id']
  isLoading: boolean
  tokenPreferences: CustomToken[]
  initTab?: {
    [key: string]: boolean
  }
  style: FlatListProps<any>['style']
  contentContainerStyle: FlatListProps<any>['contentContainerStyle']
  onScroll: FlatListProps<any>['onScroll']
}

const calculateTokenBalance = ({ amount, decimals, priceIn }: TokenResult) => {
  const balance = parseFloat(formatUnits(amount, decimals))
  const price =
    priceIn.find(({ baseCurrency }: { baseCurrency: string }) => baseCurrency === 'usd')?.price || 0

  return balance * price
}

const { isPopup } = getUiType()

const Tokens = ({
  isLoading,
  filterByNetworkId,
  tokenPreferences,
  openTab,
  setOpenTab,
  initTab,
  onScroll,
  style,
  contentContainerStyle
}: Props) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { theme } = useTheme()
  const { accountPortfolio } = usePortfolioControllerState()
  const { control, watch, setValue } = useForm({
    mode: 'all',
    defaultValues: {
      search: ''
    }
  })
  const flatlistRef = useRef<FlatList | null>(null)

  const searchValue = watch('search')

  const tokens = useMemo(
    () =>
      (accountPortfolio?.tokens || [])
        .filter((token) => {
          if (!filterByNetworkId) return true
          if (filterByNetworkId === 'rewards') return token.flags.rewardsType
          if (filterByNetworkId === 'gasTank') return token.flags.onGasTank

          return token.networkId === filterByNetworkId
        })
        .filter((token) => {
          if (!searchValue) return true

          const doesAddressMatch = token.address.toLowerCase().includes(searchValue.toLowerCase())
          const doesSymbolMatch = token.symbol.toLowerCase().includes(searchValue.toLowerCase())

          return doesAddressMatch || doesSymbolMatch
        }),
    [accountPortfolio?.tokens, filterByNetworkId, searchValue]
  )

  // Filter out tokens which are not in
  // tokenPreferences and pinned
  const hasNonZeroTokensOrPreferences = useMemo(
    () =>
      tokens
        .filter(
          ({ address, amount }) =>
            !PINNED_TOKENS.find(
              (pinnedToken) =>
                pinnedToken.address.toLowerCase() === address.toLowerCase() && amount > 0n
            ) &&
            !tokenPreferences.find(
              (token: CustomToken) => token.address.toLowerCase() === address.toLowerCase()
            ) &&
            amount > 0n
        )
        .some((token) => token.amount > 0n),
    [tokenPreferences, tokens]
  )

  const sortedTokens = useMemo(
    () =>
      tokens
        .filter(
          (token) =>
            token.amount > 0n ||
            tokenPreferences.find(
              ({ address, networkId }) =>
                token.address.toLowerCase() === address.toLowerCase() &&
                token.networkId === networkId
            ) ||
            (!hasNonZeroTokensOrPreferences &&
              PINNED_TOKENS.find(
                ({ address, networkId }) =>
                  token.address.toLowerCase() === address.toLowerCase() &&
                  token.networkId === networkId
              ))
        )
        .filter((token) => !token.isHidden)
        .sort((a, b) => {
          // If a is a rewards token and b is not, a should come before b.
          if (a.flags.rewardsType && !b.flags.rewardsType) {
            return -1
          }
          if (!a.flags.rewardsType && b.flags.rewardsType) {
            // If b is a rewards token and a is not, b should come before a.
            return 1
          }

          const aBalance = calculateTokenBalance(a)
          const bBalance = calculateTokenBalance(b)

          if (a.flags.rewardsType === b.flags.rewardsType) {
            if (aBalance === bBalance) {
              return Number(b.amount) - Number(a.amount)
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
    [tokens, tokenPreferences, hasNonZeroTokensOrPreferences]
  )

  const navigateToAddCustomToken = useCallback(() => {
    navigate(WEB_ROUTES.customTokens)
  }, [navigate])

  useEffect(() => {
    setValue('search', '')

    if (!flatlistRef.current) return

    // Fixes weird behaviour that occurs when you scroll in one tab and then move to another and back.
    flatlistRef.current?.scrollToOffset({
      offset: 0,
      animated: false
    })
  }, [setValue, openTab])

  return (
    <FlatList
      ref={flatlistRef}
      style={style}
      contentContainerStyle={contentContainerStyle}
      ListHeaderComponent={<DashboardBanners />}
      data={[
        'header',
        ...(initTab?.tokens ? sortedTokens : []),
        !sortedTokens.length ? 'empty' : ''
      ]}
      renderItem={({ item }) => {
        if (item === 'header') {
          return (
            <View style={{ backgroundColor: theme.primaryBackground }}>
              <TabsAndSearch openTab={openTab} setOpenTab={setOpenTab} searchControl={control} />
              <View style={[flexbox.directionRow, spacings.mbTy, spacings.phTy]}>
                <Text
                  appearance="secondaryText"
                  fontSize={14}
                  weight="medium"
                  style={{ flex: 1.5 }}
                >
                  {t('ASSET/AMOUNT')}
                </Text>
                <Text
                  appearance="secondaryText"
                  fontSize={14}
                  weight="medium"
                  style={{ flex: 0.7 }}
                >
                  {t('PRICE')}
                </Text>
                <Text
                  appearance="secondaryText"
                  fontSize={14}
                  weight="medium"
                  style={{ flex: 0.8, textAlign: 'right' }}
                >
                  {t('USD VALUE')}
                </Text>
              </View>
            </View>
          )
        }

        if (item === 'empty') {
          return (
            <View style={[flexbox.alignCenter, spacings.pv]}>
              {searchValue ? (
                <Text fontSize={16} weight="medium">
                  {t('No tokens found')}
                </Text>
              ) : (
                <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                  <Text fontSize={16} weight="medium" style={isLoading && spacings.mrTy}>
                    {isLoading ? t('Looking for tokens') : t('No tokens yet')}
                  </Text>
                  {!!isLoading && <Spinner style={{ width: 16, height: 16 }} />}
                </View>
              )}
            </View>
          )
        }

        if (!initTab?.tokens || !item) return null

        return <TokenItem token={item} tokenPreferences={tokenPreferences} />
      }}
      keyExtractor={(tokenOrElement) => {
        if (typeof tokenOrElement === 'string') {
          return tokenOrElement
        }

        const token = tokenOrElement

        return `${token?.address}-${token?.networkId}-${token?.flags?.onGasTank ? 'gas-tank' : ''}${
          token?.flags?.rewardsType ? 'rewards' : ''
        }${!token?.flags?.onGasTank && !token?.flags?.rewardsType ? 'token' : ''}`
      }}
      stickyHeaderIndices={[1]} // Makes the header sticky
      ListFooterComponent={
        <Button type="secondary" text={t('+ Add Custom')} onPress={navigateToAddCustomToken} />
      }
      ListFooterComponentStyle={spacings.ptSm}
      removeClippedSubviews
      onEndReachedThreshold={isPopup ? 5 : 2.5} // ListFooterComponent will flash while scrolling fast if this value is too low.
      initialNumToRender={isPopup ? 10 : 20}
      windowSize={9} // Larger values can cause performance issues.
      onScroll={onScroll}
    />
  )
}

export default React.memo(Tokens)
