import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'
import { TokenResult } from '@ambire-common/libs/portfolio'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import RouteStepsArrow from '@web/modules/swap-and-bridge/components/RouteStepsArrow'
import RouteStepsToken from '@web/modules/swap-and-bridge/components/RouteStepsToken'

import styles from './styles'

const RouteStepsPlaceholder = ({
  fromSelectedToken,
  toSelectedToken,
  withBadge
}: {
  fromSelectedToken: TokenResult
  toSelectedToken: SwapAndBridgeToToken
  withBadge?: 'loading' | 'no-route-found'
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation()

  const getBadge = useMemo(() => {
    if (withBadge === 'loading')
      return (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <Spinner style={{ width: 16, height: 16, ...spacings.mrTy }} />
          <Text weight="medium" fontSize={12} testID="route-loading-text-sab">
            {t('Fetching best route...')}
          </Text>
        </View>
      )
    if (withBadge === 'no-route-found')
      return (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <WarningIcon
            width={14}
            height={14}
            style={spacings.mrTy}
            strokeWidth="2.2"
            color={theme.warningDecorative}
          />
          <Text appearance="warningText" weight="medium" fontSize={12}>
            {t('No route found!')}
          </Text>
        </View>
      )

    return null
  }, [t, withBadge, theme.warningDecorative])

  const getBadgeStyle = useMemo(() => {
    if (withBadge === 'loading') return { backgroundColor: '#54597A14' }
    if (withBadge === 'no-route-found') return { backgroundColor: theme.warningBackground }

    return undefined
  }, [withBadge, theme])

  return (
    <View style={flexbox.flex1}>
      <View style={[styles.container, spacings.mb]}>
        <RouteStepsToken
          address={fromSelectedToken.address}
          chainId={fromSelectedToken.chainId}
          symbol={fromSelectedToken.symbol}
        />
        <RouteStepsArrow
          containerStyle={flexbox.flex1}
          badge={getBadge}
          badgeStyle={getBadgeStyle}
          type={withBadge === 'no-route-found' ? 'warning' : 'default'}
        />
        <RouteStepsToken
          address={toSelectedToken.address}
          uri={toSelectedToken.icon}
          chainId={BigInt(toSelectedToken.chainId)}
          symbol={toSelectedToken.symbol}
          isLast
        />
      </View>
      <Text fontSize={12} weight="medium">
        <Text fontSize={12} weight="medium">
          {t('Estimation: {{time}}', { time: '-/-' })}
        </Text>
      </Text>
    </View>
  )
}

export default React.memo(RouteStepsPlaceholder)
