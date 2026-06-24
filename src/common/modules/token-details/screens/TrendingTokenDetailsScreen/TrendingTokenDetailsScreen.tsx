import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { TrendingToken } from '@ambire-common/interfaces/dapp'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import OpenIcon from '@common/assets/svg/OpenIcon'
import LayoutWrapper from '@common/components/LayoutWrapper'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import Header from '@common/modules/header/components/Header/Header'
import TokenDetailsTitle from '@common/modules/token-details/components/Title'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import ManifestImage from '@web/components/ManifestImage'

const formatChange = (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`

type InfoRow = { label: string; value: string }

const Row = ({ label, value, isLast }: InfoRow & { isLast: boolean }) => (
  <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, !isLast && spacings.mbSm]}>
    <Text weight="medium" fontSize={14} appearance="secondaryText">
      {label}
    </Text>
    <Text weight="medium" fontSize={14} appearance="primaryText">
      {value}
    </Text>
  </View>
)

const TrendingTokenDetailsScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { state } = useRoute()
  const { state: dappsState } = useController('DappsController')
  const [bindCoingeckoAnim, coingeckoAnimStyle] = useCustomHover({
    property: 'opacity',
    values: { from: 1, to: 0.7 }
  })

  const token: TrendingToken | undefined = useMemo(
    () =>
      (dappsState.trendingTokens || []).find(
        (tt: TrendingToken) => tt.id === state?.trendingTokenId
      ),
    [dappsState.trendingTokens, state?.trendingTokenId]
  )

  const rows: InfoRow[] = useMemo(() => {
    if (!token) return []
    return [
      typeof token.marketCapRank === 'number' && {
        label: t('Market cap rank'),
        value: `#${token.marketCapRank}`
      },
      !!token.marketCap && { label: t('Market cap'), value: token.marketCap },
      !!token.totalVolume && { label: t('Volume (24h)'), value: token.totalVolume }
    ].filter(Boolean) as InfoRow[]
  }, [token, t])

  return (
    <LayoutWrapper>
      <Header.Wrapper>
        <Header.BackButton />
        <Header.Logo />
      </Header.Wrapper>
      {!token ? (
        <View style={[flexbox.flex1, flexbox.center, spacings.phSm]}>
          <Text fontSize={16} appearance="secondaryText">
            {t('Trending token not found.')}
          </Text>
        </View>
      ) : (
        <ScrollableWrapper contentContainerStyle={spacings.phSm}>
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
            <ManifestImage
              uri={token.icon}
              size={48}
              isRound
              containerStyle={{ ...spacings.mrSm, backgroundColor: theme.primaryBackground }}
            />
            <View style={flexbox.flex1}>
              <Text fontSize={20} weight="semiBold" appearance="primaryText" numberOfLines={1}>
                {token.symbol}
              </Text>
              <Text fontSize={14} weight="medium" appearance="secondaryText" numberOfLines={1}>
                {token.name}
              </Text>
            </View>
          </View>

          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbLg]}>
            <Text fontSize={32} weight="medium" style={{ ...spacings.mrTy, lineHeight: 48 }}>
              {formatDecimals(token.priceUSD, 'price')}
            </Text>
            {typeof token.priceChange24hUSD === 'number' && (
              <Text
                fontSize={14}
                weight="number_medium"
                appearance={token.priceChange24hUSD >= 0 ? 'successText' : 'errorText'}
              >
                {formatChange(token.priceChange24hUSD)} ({t('24h')})
              </Text>
            )}
          </View>

          {!!rows.length && (
            <View
              style={[
                spacings.phSm,
                spacings.pv,
                spacings.mbTy,
                { backgroundColor: theme.secondaryBackground, borderRadius: BORDER_RADIUS_PRIMARY }
              ]}
            >
              {rows.map((row, index) => (
                <Row key={row.label} {...row} isLast={index === rows.length - 1} />
              ))}
            </View>
          )}

          <AnimatedPressable
            {...bindCoingeckoAnim}
            onPress={() => openInTab({ url: `https://www.coingecko.com/en/coins/${token.id}` })}
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              flexbox.justifySpaceBetween,
              spacings.phSm,
              spacings.mbTy,
              {
                height: 56,
                backgroundColor: theme.secondaryBackground,
                borderRadius: BORDER_RADIUS_PRIMARY
              },
              coingeckoAnimStyle
            ]}
          >
            <Text fontSize={14} weight="medium" appearance="secondaryText">
              {t('View on CoinGecko')}
            </Text>
            <OpenIcon />
          </AnimatedPressable>

          {!!token.description && (
            <>
              <TokenDetailsTitle title={t('About')} />
              <View
                style={[
                  spacings.phSm,
                  spacings.pv,
                  {
                    backgroundColor: theme.secondaryBackground,
                    borderRadius: BORDER_RADIUS_PRIMARY
                  }
                ]}
              >
                <Text fontSize={14} weight="regular" appearance="secondaryText">
                  {token.description}
                </Text>
              </View>
            </>
          )}
        </ScrollableWrapper>
      )}
    </LayoutWrapper>
  )
}

export default React.memo(TrendingTokenDetailsScreen)
