import React from 'react'
import { View, ViewStyle } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'

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
  return (
    <View
      style={[
        styles.tokenWrapper,
        wrapperStyle,
        { alignItems: isLast ? 'flex-end' : 'flex-start' }
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

      <View
        style={[
          styles.textContainer,
          { alignItems: amount.length > 5 ? (isLast ? 'flex-end' : 'flex-start') : 'center' }
        ]}
      >
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
