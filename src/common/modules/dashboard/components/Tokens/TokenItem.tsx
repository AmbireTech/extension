import { UsePrivateModeReturnType } from 'ambire-common/src/hooks/usePrivateMode'
import { formatFloatTokenAmount } from 'ambire-common/src/services/formatter'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import SendIcon from '@common/assets/svg/SendIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isWeb } from '@common/config/env'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

type Props = {
  img: any
  symbol: string
  balance: number
  balanceUSD: number
  decimals: number
  address: string
  networkId: string | undefined
  onPress: (symbol: string) => any
  hidePrivateValue: UsePrivateModeReturnType['hidePrivateValue']
}

const TokenItem = ({
  img,
  symbol,
  balance,
  balanceUSD,
  decimals,
  address,
  networkId,
  onPress,
  hidePrivateValue
}: Props) => {
  return (
    <View style={isWeb ? styles.tokenItemContainerWeb : styles.tokenItemContainer}>
      <View style={[spacings.prSm, flexboxStyles.justifyCenter]}>
        <TokenIcon withContainer uri={img} networkId={networkId} address={address} />
      </View>

      <Text fontSize={14} style={[spacings.prSm, styles.tokenSymbol]} numberOfLines={2}>
        {symbol}
      </Text>

      <View style={[styles.tokenValue, flexboxStyles.flex1]}>
        <Text fontSize={14} numberOfLines={1}>
          {hidePrivateValue(
            formatFloatTokenAmount(Number(balance).toFixed(balance < 1 ? 8 : 4), true, decimals)
          )}
        </Text>
        <Text fontSize={12} style={textStyles.highlightPrimary}>
          ${hidePrivateValue(balanceUSD?.toFixed(2))}
        </Text>
      </View>

      <View style={spacings.plSm}>
        <TouchableOpacity
          onPress={onPress ? () => onPress(symbol) : () => null}
          hitSlop={{ bottom: 10, top: 10, left: 5, right: 5 }}
          style={styles.sendContainer}
        >
          <SendIcon />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default React.memo(TokenItem)
