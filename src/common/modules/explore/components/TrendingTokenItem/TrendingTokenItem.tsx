import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { TrendingToken } from '@ambire-common/interfaces/dapp'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  token: TrendingToken
}

const formatChange = (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`

const TrendingTokenItem = ({ token }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const { state: networks } = useController('NetworksController', (s) => s.networks)

  const chainId = useMemo(
    () => networks.find((n) => n.platformId === token.platformId)?.chainId,
    [networks, token.platformId]
  )

  const [bindAnim, animStyle] = useCustomHover({
    property: 'backgroundColor',
    values: { from: theme.secondaryBackground, to: theme.tertiaryBackground }
  })

  const handlePress = useCallback(() => {
    navigate(ROUTES.trendingTokenDetails, { state: { trendingTokenId: token.id } })
  }, [navigate, token.id])

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.phSm,
        spacings.pvTy,
        spacings.mbTy,
        { borderRadius: BORDER_RADIUS_PRIMARY, minHeight: 64 },
        animStyle
      ]}
      {...bindAnim}
    >
      <View style={[spacings.mrSm, flexbox.justifyCenter]}>
        <TokenIcon
          withContainer
          address={token.address ?? ''}
          chainId={chainId}
          uri={token.icon}
          containerHeight={40}
          containerWidth={40}
          width={32}
          height={32}
          networkSize={16}
        />
      </View>
      <View style={flexbox.flex1}>
        <Text fontSize={16} weight="semiBold" appearance="primaryText" numberOfLines={1}>
          {token.symbol.toUpperCase()}
        </Text>
        <Text fontSize={12} weight="number_medium" appearance="secondaryText" numberOfLines={1}>
          {token.name}
        </Text>
      </View>
      <View style={[flexbox.alignEnd, { marginLeft: SPACING_SM }]}>
        <Text fontSize={16} weight="number_bold" appearance="primaryText">
          {formatDecimals(token.priceUSD, 'price')}
        </Text>
        {typeof token.priceChange24hUSD === 'number' && (
          <Text
            fontSize={12}
            weight="number_medium"
            appearance={token.priceChange24hUSD >= 0 ? 'successText' : 'errorText'}
          >
            {formatChange(token.priceChange24hUSD)}
          </Text>
        )}
      </View>
    </AnimatedPressable>
  )
}

export default React.memo(TrendingTokenItem)
