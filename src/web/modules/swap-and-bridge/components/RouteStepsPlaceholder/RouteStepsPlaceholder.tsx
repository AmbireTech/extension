import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SocketAPIToken } from '@ambire-common/interfaces/swapAndBridge'
import { TokenResult } from '@ambire-common/libs/portfolio'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { iconColors } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import RouteStepsArrow from '../RouteStepsArrow'
import getStyles from './styles'

const RouteStepsPlaceholder = ({
  fromSelectedToken,
  toSelectedToken,
  withBadge
}: {
  fromSelectedToken: TokenResult
  toSelectedToken: SocketAPIToken
  withBadge?: 'loading' | 'no-route-found'
}) => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()

  const getBadge = useMemo(() => {
    if (withBadge === 'loading')
      return (
        <Text weight="medium" fontSize={12}>
          {t('Fetching best route...')}
        </Text>
      )
    if (withBadge === 'no-route-found')
      return (
        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
          <WarningIcon
            width={14}
            height={14}
            style={spacings.mrTy}
            strokeWidth="2.2"
            color={iconColors.warning}
          />
          <Text appearance="warningText" weight="medium" fontSize={12}>
            {t('No route found!')}
          </Text>
        </View>
      )

    return null
  }, [t, withBadge])

  const getBadgeStyle = useMemo(() => {
    if (withBadge === 'loading') return { backgroundColor: '#54597A14' }
    if (withBadge === 'no-route-found') return { backgroundColor: theme.warningBackground }

    return undefined
  }, [withBadge, theme])

  return (
    <View style={flexbox.flex1}>
      <View style={[styles.container, spacings.mb]}>
        <View style={styles.tokenContainer}>
          <View style={styles.tokenWrapper}>
            <TokenIcon
              width={30}
              height={30}
              address={fromSelectedToken.address}
              networkId={fromSelectedToken.networkId}
              withNetworkIcon
            />
          </View>
          <Text fontSize={14} weight="medium">
            {fromSelectedToken.symbol}
          </Text>
        </View>
        <RouteStepsArrow
          containerStyle={flexbox.flex1}
          badge={getBadge}
          badgeStyle={getBadgeStyle}
          type={withBadge === 'no-route-found' ? 'warning' : 'default'}
        />
        <View style={styles.tokenContainer}>
          <View style={styles.tokenWrapper}>
            <TokenIcon
              width={30}
              height={30}
              uri={toSelectedToken.icon}
              chainId={toSelectedToken.chainId}
              withNetworkIcon
            />
          </View>
          <Text fontSize={14} weight="medium">
            {toSelectedToken.symbol}
          </Text>
        </View>
      </View>
      <Text>
        <Text fontSize={12} weight="medium">
          {t('Total gas fees: {{fees}}', {
            fees: '-/-'
          })}
        </Text>
        <Text fontSize={12} weight="medium" appearance="secondaryText">
          {'  |  '}
        </Text>
        <Text fontSize={12} weight="medium">
          {t('Estimation: {{time}}', {
            time: '-/-'
          })}
        </Text>
      </Text>
    </View>
  )
}

export default React.memo(RouteStepsPlaceholder)
