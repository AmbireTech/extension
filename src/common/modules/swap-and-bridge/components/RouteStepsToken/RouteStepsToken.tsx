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
  align?: 'left' | 'right' | 'center'
}

type RouteStepsTokenIconProps = Pick<Props, 'address' | 'chainId' | 'uri'>
type RouteStepsTokenAmountProps = Pick<
  Props,
  'symbol' | 'amount' | 'amountInUsd' | 'wrapperStyle' | 'align'
>
type RouteStepsTokenWrapperProps = {
  wrapperStyle?: ViewStyle
  children: React.ReactNode
}

export const RouteStepsTokenWrapper: React.FC<RouteStepsTokenWrapperProps> = ({
  wrapperStyle,
  children
}) => {
  return <View style={wrapperStyle}>{children}</View>
}

export const RouteStepsTokenIcon: React.FC<RouteStepsTokenIconProps> = ({
  address,
  chainId,
  uri
}) => {
  return (
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
  )
}

export const RouteStepsTokenAmount: React.FC<RouteStepsTokenAmountProps> = ({
  symbol,
  amount = '',
  amountInUsd,
  wrapperStyle,
  align = 'center'
}) => {
  return (
    <View
      style={[
        styles.amountWrapper,
        wrapperStyle,
        { alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }
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
  )
}

const RouteStepsToken: React.FC<Props> = ({
  symbol,
  amount = '',
  amountInUsd,
  wrapperStyle,
  align,
  ...iconProps
}) => {
  return (
    <RouteStepsTokenWrapper wrapperStyle={wrapperStyle}>
      <RouteStepsTokenIcon {...iconProps} />
      <RouteStepsTokenAmount
        symbol={symbol}
        amount={amount}
        amountInUsd={amountInUsd}
        align={align}
      />
    </RouteStepsTokenWrapper>
  )
}

export default React.memo(RouteStepsToken)
