import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import gasTankFeeTokens from '@ambire-common/consts/gasTankFeeTokens'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { TabLayoutContainer, TabLayoutWrapperMainContent } from '@web/components/TabLayoutWrapper'

import getStyles from './styles'

type SupportedNetwork = {
  name: string
  chainId: bigint
  iconUrls?: string[]
}

const SUPPORTED_NETWORKS: SupportedNetwork[] = [
  { name: 'Ethereum', chainId: 1n },
  { name: 'Arbitrum', chainId: 42161n },
  { name: 'Optimism', chainId: 10n },
  { name: 'Base', chainId: 8453n },
  { name: 'Polygon', chainId: 137n },
  { name: 'Scroll', chainId: 534352n },
  { name: 'Mantle', chainId: 5000n },
  { name: 'Gnosis', chainId: 100n },
  { name: 'Unichain', chainId: 130n },
  { name: 'Binance Smart Chain', chainId: 56n },
  { name: 'Linea', chainId: 59144n },
  { name: 'Monad', chainId: 143n },
  { name: 'Avalanche', chainId: 43114n },
  { name: 'World Chain', chainId: 480n },
  { name: 'Ink', chainId: 57073n },
  { name: 'Hype', chainId: 999n },
  { name: 'Celo', chainId: 42220n },
  {
    name: 'Robinhood',
    chainId: 46630n,
    iconUrls: [
      'https://assets.coingecko.com/asset_platforms/images/102132299/standard/robinhood.png'
    ]
  },
  { name: 'MegaETH', chainId: 4326n }
]

const BENEFITS = [
  'No EOA account is required to execute Safe account transactions.',
  'No need to have the chain native token to execute',
  'Better privacy: The Ambire infrastructure executes the transaction, so EOAs are not leaked.'
] as const

const GasTankScreen = () => {
  const { t } = useTranslation()
  const { styles } = useTheme(getStyles)
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

  return (
    <TabLayoutContainer
      width="full"
      header={
        <HeaderWithTitle
          title={t('Gas tank for Safe accounts')}
          displayBackButtonIn="always"
          width="xl"
        />
      }
    >
      <TabLayoutWrapperMainContent>
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
            <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mb]}>
              <Text fontSize={22} weight="semiBold">
                {t('Top-up tokens')}
              </Text>
              <Text fontSize={14} appearance="tertiaryText" style={spacings.mlSm}>
                {t('{{count}} supported', { count: depositTokens.length })}
              </Text>
            </View>
            <View style={styles.tokensGrid}>
              {depositTokens.map((token) => {
                const tokenImage =
                  (token as { currencyIcon?: string; icon?: string }).currencyIcon ||
                  (token as { icon?: string }).icon
                const chainId = token.chainId
                const chainIdString = chainId.toString()
                const networkName = networkNameByChainId[chainIdString]
                const tokenKey = `${chainIdString}:${token.address}`

                return (
                  <View key={tokenKey} style={styles.tokenCard}>
                    <TokenIcon
                      address={token.address}
                      chainId={chainId}
                      uri={tokenImage}
                      withContainer
                      withNetworkIcon
                      containerHeight={40}
                      containerWidth={40}
                      width={28}
                      height={28}
                      networkSize={16}
                    />
                    <View style={styles.tokenMeta}>
                      <Text fontSize={15} weight="semiBold" numberOfLines={1}>
                        {token.symbol.toUpperCase()}
                      </Text>
                      <Text fontSize={12} appearance="tertiaryText" numberOfLines={1}>
                        {networkName
                          ? t(networkName)
                          : t('Chain ID: {{chainId}}', { chainId: chainIdString })}
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          <View>
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
        </View>
      </TabLayoutWrapperMainContent>
    </TabLayoutContainer>
  )
}

export default React.memo(GasTankScreen)
