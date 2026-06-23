import React, { useCallback } from 'react'
import { View } from 'react-native'

import { TrendingToken } from '@ambire-common/interfaces/dapp'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import { AnimatedPressable, useCustomHover } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import ManifestImage from '@web/components/ManifestImage'

type Props = {
  token: TrendingToken
}

const formatChange = (change: number) => `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`

const TrendingTokenItem = ({ token }: Props) => {
  const { theme } = useTheme()
  const { navigate } = useNavigation()

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
      <ManifestImage
        uri={token.icon}
        size={40}
        isRound
        containerStyle={{ ...spacings.mrSm, backgroundColor: theme.primaryBackground }}
      />
      <View style={flexbox.flex1}>
        <Text fontSize={16} weight="semiBold" appearance="primaryText" numberOfLines={1}>
          {token.symbol}
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
