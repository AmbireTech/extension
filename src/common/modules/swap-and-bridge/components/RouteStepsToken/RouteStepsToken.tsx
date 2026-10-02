import React, { useId } from 'react'
import { View, ViewStyle } from 'react-native'

import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile } from '@common/config/env'

import styles from './styles'

interface Props {
  symbol: string
  address: string
  chainId?: bigint
  uri?: string
  isLast?: boolean
  amount?: string
  /** Unrounded amount, shown in a tooltip when `amount` is shortened to fit the label */
  fullAmount?: string
  amountInUsd?: number
  wrapperStyle?: ViewStyle
  align?: 'left' | 'right' | 'center'
}

type RouteStepsTokenIconProps = Pick<Props, 'address' | 'chainId' | 'uri'>
type RouteStepsTokenAmountProps = Pick<
  Props,
  'symbol' | 'amount' | 'fullAmount' | 'amountInUsd' | 'wrapperStyle' | 'align'
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
  fullAmount,
  amountInUsd,
  wrapperStyle,
  align = 'center'
}) => {
  const fullAmountTooltipId = useId()

  return (
    <View
      style={[
        styles.amountWrapper,
        wrapperStyle,
        { alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }
      ]}
    >
      <Text
        fontSize={isMobile ? 12 : 14}
        weight="medium"
        style={styles.text}
        dataSet={
          fullAmount
            ? createGlobalTooltipDataSet({
                id: fullAmountTooltipId,
                content: `${fullAmount} ${symbol}`
              })
            : undefined
        }
      >
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
