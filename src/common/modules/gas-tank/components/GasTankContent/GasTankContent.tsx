import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import gasTankFeeTokens from '@ambire-common/consts/gasTankFeeTokens'
import FilterIcon from '@common/assets/svg/FilterIcon'
import Checkbox from '@common/components/Checkbox'
import HoverablePressable from '@common/components/HoverablePressable'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type SupportedNetwork = {
  name: string
  chainId: bigint
  iconUrls?: string[]
}

type GasTankFeeToken = (typeof gasTankFeeTokens)[number]

type DepositTokenGroup = {
  symbol: string
  token: GasTankFeeToken
  networks: {
    chainId: bigint
    name?: string
  }[]
}

const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  { name: 'Ethereum', chainId: 1n },
  { name: 'Optimism', chainId: 10n },
  { name: 'Binance Smart Chain', chainId: 56n },
  { name: 'Gnosis', chainId: 100n },
  { name: 'Unichain', chainId: 130n },
  { name: 'Polygon', chainId: 137n },
  { name: 'Monad', chainId: 143n },
  { name: 'World Chain', chainId: 480n },
  { name: 'Hype', chainId: 999n },
  { name: 'MegaETH', chainId: 4326n },
  { name: 'Mantle', chainId: 5000n },
  { name: 'Base', chainId: 8453n },
  { name: 'Celo', chainId: 42220n },
  { name: 'Arbitrum', chainId: 42161n },
  { name: 'Avalanche', chainId: 43114n },
  {
    name: 'Robinhood',
    chainId: 46630n,
    iconUrls: [
      'https://assets.coingecko.com/asset_platforms/images/102132299/standard/robinhood.png'
    ]
  },
  { name: 'Ink', chainId: 57073n },
  { name: 'Linea', chainId: 59144n },
  { name: 'Scroll', chainId: 534352n }
]

const BENEFITS = [
  'No EOA account is required to execute Safe account transactions.',
  'No need to have the chain native token to execute',
  'Better privacy: The Ambire infrastructure executes the transaction, so EOAs are not leaked.'
] as const

const getTokenDisplaySymbol = (symbol: string) => {
  if (symbol.toLowerCase() === 'aeth') return 'ETH'

  return symbol.toUpperCase()
}

const GasTankContent = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const [isTokenFilterOpen, setIsTokenFilterOpen] = useState(false)
  const [selectedNetworkChainIds, setSelectedNetworkChainIds] = useState<string[]>([])
  const {
    state: { allNetworks }
  } = useController('NetworksController')

  const depositTokens = useMemo(
    () => gasTankFeeTokens.filter(({ disableGasTankDeposit }) => !disableGasTankDeposit),
    []
  )

  const networkNameByChainId = useMemo(() => {
    return allNetworks.reduce<{ [chainId: string]: string }>((acc, network) => {
      acc[network.chainId.toString()] = network.name
      return acc
    }, {})
  }, [allNetworks])

  const depositTokenGroups = useMemo(() => {
    const tokenGroups = depositTokens.reduce<Map<string, DepositTokenGroup>>((acc, token) => {
      const symbol = getTokenDisplaySymbol(token.symbol)
      const existingGroup = acc.get(symbol)
      const chainIdString = token.chainId.toString()

      if (existingGroup) {
        if (!existingGroup.networks.some((network) => network.chainId === token.chainId)) {
          existingGroup.networks.push({
            chainId: token.chainId,
            name: networkNameByChainId[chainIdString]
          })
        }

        return acc
      }

      acc.set(symbol, {
        symbol,
        token,
        networks: [
          {
            chainId: token.chainId,
            name: networkNameByChainId[chainIdString]
          }
        ]
      })

      return acc
    }, new Map())

    return Array.from(tokenGroups.values())
      .map((group) => ({
        ...group,
        networks: group.networks.sort((a, b) => {
          if (a.chainId === b.chainId) return 0

          return a.chainId > b.chainId ? 1 : -1
        })
      }))
      .sort((a, b) => {
        if (a.networks.length !== b.networks.length) return b.networks.length - a.networks.length

        return a.symbol.localeCompare(b.symbol)
      })
  }, [depositTokens, networkNameByChainId])

  const tokenFilterNetworks = useMemo(() => {
    return Array.from(
      depositTokenGroups
        .reduce<Map<string, DepositTokenGroup['networks'][number]>>((acc, group) => {
          group.networks.forEach((network) => {
            acc.set(network.chainId.toString(), network)
          })

          return acc
        }, new Map())
        .values()
    ).sort((a, b) => {
      if (a.chainId === b.chainId) return 0

      return a.chainId > b.chainId ? 1 : -1
    })
  }, [depositTokenGroups])

  const filteredDepositTokenGroups = useMemo(() => {
    if (!selectedNetworkChainIds.length) return depositTokenGroups

    const selectedNetworkChainIdsSet = new Set(selectedNetworkChainIds)

    return depositTokenGroups
      .map((group) => ({
        ...group,
        networks: group.networks.filter((network) =>
          selectedNetworkChainIdsSet.has(network.chainId.toString())
        )
      }))
      .filter((group) => group.networks.length)
  }, [depositTokenGroups, selectedNetworkChainIds])

  const toggleTokenFilter = useCallback(() => {
    setIsTokenFilterOpen((isOpen) => !isOpen)
  }, [])

  const clearSelectedNetworks = useCallback(() => {
    setSelectedNetworkChainIds([])
  }, [])

  const toggleSelectedNetwork = useCallback((chainId: string) => {
    setSelectedNetworkChainIds((chainIds) =>
      chainIds.includes(chainId) ? chainIds.filter((id) => id !== chainId) : [...chainIds, chainId]
    )
  }, [])

  return (
    <View style={styles.content}>
      <View style={styles.hero}>
        <Text fontSize={34} weight="semiBold" style={[spacings.mbSm, { textAlign: 'center' }]}>
          {t('Gas tank for Safe accounts')}
        </Text>
        <Text fontSize={16} appearance="secondaryText" style={styles.description}>
          {t(
            'Deposit once into your Gas Tank and use that balance to pay transaction fees across supported networks. For each transaction, you can choose whether to pay from the Gas Tank or broadcast with the standard network fee token.'
          )}
        </Text>
        <View style={styles.notice}>
          <Text fontSize={14} weight="medium" appearance="warningText">
            {t(
              'Gas Tank is a premium feature. Transaction costs are slightly higher than broadcasting with standard ETH, and you stay in control by choosing the fee option separately for every transaction.'
            )}
          </Text>
        </View>
      </View>

      <View style={spacings.mbXl}>
        <Text fontSize={22} weight="semiBold" style={spacings.mb}>
          {t('What this unlocks')}
        </Text>
        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefit}>
              <Text fontSize={15} weight="medium">
                {t(benefit)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={spacings.mbXl}>
        <Text fontSize={22} weight="semiBold" style={spacings.mb}>
          {t('Supported networks')}
        </Text>
        <View style={styles.networkGrid}>
          {SUPPORTED_NETWORKS.map((network) => (
            <View key={network.chainId.toString()} style={styles.networkCard}>
              <View style={styles.networkIconWrapper}>
                <NetworkIcon
                  id={network.chainId.toString()}
                  name={network.name}
                  uris={network.iconUrls}
                  size={40}
                  withTooltip={false}
                />
              </View>
              <Text fontSize={17} weight="semiBold" style={spacings.mbTy} numberOfLines={1}>
                {t(network.name)}
              </Text>
              <Text fontSize={13} appearance="tertiaryText">
                {t('Chain ID: {{chainId}}', { chainId: network.chainId.toString() })}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.tokensSection}>
        <View style={styles.tokensHeader}>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Text fontSize={22} weight="semiBold">
              {t('Top-up tokens')}
            </Text>
            <Text fontSize={14} appearance="tertiaryText" style={spacings.mlSm}>
              {t('{{count}} supported', { count: filteredDepositTokenGroups.length })}
            </Text>
          </View>
          <HoverablePressable style={styles.filterButton} onPress={toggleTokenFilter}>
            <FilterIcon
              width={18}
              height={18}
              color={selectedNetworkChainIds.length ? theme.primaryAccent : theme.iconPrimary}
            />
            {!!selectedNetworkChainIds.length && (
              <View style={styles.filterBadge}>
                <Text fontSize={11} weight="semiBold" color="#fff">
                  {selectedNetworkChainIds.length}
                </Text>
              </View>
            )}
          </HoverablePressable>
        </View>
        {isTokenFilterOpen && (
          <View style={styles.filterPanel}>
            <View style={styles.filterPanelHeader}>
              <Text fontSize={14} weight="semiBold">
                {t('Filter by network')}
              </Text>
              {!!selectedNetworkChainIds.length && (
                <HoverablePressable onPress={clearSelectedNetworks}>
                  <Text fontSize={13} appearance="linkText" weight="medium">
                    {t('Clear')}
                  </Text>
                </HoverablePressable>
              )}
            </View>
            <View style={styles.filterNetworkGrid}>
              {tokenFilterNetworks.map((network) => {
                const chainIdString = network.chainId.toString()
                const isSelected = selectedNetworkChainIds.includes(chainIdString)

                return (
                  <View key={chainIdString} style={styles.filterNetworkOption}>
                    <Checkbox
                      value={isSelected}
                      onValueChange={() => toggleSelectedNetwork(chainIdString)}
                      style={styles.filterCheckbox}
                    />
                    <NetworkIcon id={chainIdString} size={18} withTooltip={false} />
                    <Text
                      fontSize={13}
                      appearance="secondaryText"
                      style={spacings.mlTy}
                      numberOfLines={1}
                    >
                      {network.name
                        ? t(network.name)
                        : t('Chain ID: {{chainId}}', { chainId: chainIdString })}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}
        <View style={styles.tokensGrid}>
          {filteredDepositTokenGroups.map(({ symbol, token, networks }) => {
            const tokenImage =
              (token as { currencyIcon?: string; icon?: string }).currencyIcon ||
              (token as { icon?: string }).icon

            return (
              <View key={symbol} style={styles.tokenCard}>
                <View style={styles.tokenHeader}>
                  <TokenIcon
                    address={token.address}
                    chainId={token.chainId}
                    uri={tokenImage}
                    withContainer
                    withNetworkIcon={false}
                    containerHeight={40}
                    containerWidth={40}
                    width={28}
                    height={28}
                  />
                  <Text fontSize={17} weight="semiBold" style={spacings.mlSm} numberOfLines={1}>
                    {symbol}
                  </Text>
                </View>
                <Text fontSize={14} weight="semiBold" style={styles.tokenNetworksTitle}>
                  {t('Networks')}:
                </Text>
                <View style={styles.tokenNetworks}>
                  {networks.map((network) => {
                    const chainIdString = network.chainId.toString()

                    return (
                      <View key={chainIdString} style={styles.tokenNetwork}>
                        <NetworkIcon id={chainIdString} size={16} withTooltip={false} />
                        <Text
                          fontSize={12}
                          appearance="tertiaryText"
                          numberOfLines={1}
                          style={spacings.mlTy}
                        >
                          {network.name
                            ? t(network.name)
                            : t('Chain ID: {{chainId}}', { chainId: chainIdString })}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

export default React.memo(GasTankContent)
