import React from 'react'
import { View, ViewStyle } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

import styles from './styles'

interface Props {
  symbol: string
  address: string
  chainId?: bigint
  uri?: string
  isLast?: boolean
  amount?: string
  amountInUsd?: number
  wrapperStyle?: ViewStyle
}

const RouteStepsToken: React.FC<Props> = ({
  symbol,
  address,
  chainId,
  uri,
  isLast = false,
  amount = '',
  amountInUsd,
  wrapperStyle
}) => {
  const { theme, themeType } = useTheme()

  return (
    <View
      style={[
        styles.tokenWrapper,
        wrapperStyle,
        {
          backgroundColor: themeType === THEME_TYPES.LIGHT ? theme.neutral100 : theme.backdrop,
          borderRadius: BORDER_RADIUS_PRIMARY
        }
      ]}
    >
      <View style={styles.tokenContainer}>
        <TokenIcon
          uri={uri}
          width={28}
          height={28}
          address={address}
          chainId={chainId}
          withNetworkIcon
          withContainer
        />
      </View>

      <View style={[styles.textContainer]}>
        <Text fontSize={14} weight="medium" style={styles.text}>
          {amount ? `${amount} ` : ''}
          {symbol}
        </Text>
        {!!amountInUsd && (
          <Text style={styles.text} fontSize={12} appearance="secondaryText" weight="medium">
            {formatDecimals(amountInUsd, 'price')}
          </Text>
        )}
      </View>
    </View>
  )
}

export default React.memo(RouteStepsToken)
