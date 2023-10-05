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
  price: number
  onPress: (symbol: string) => any
  hidePrivateValue: UsePrivateModeReturnType['hidePrivateValue']
  wrapperEndChildren: any
}

const TokenItem = ({
  img,
  symbol,
  balance,
  balanceUSD,
  decimals,
  address,
  networkId,
  price,
  onPress,
  hidePrivateValue,
  wrapperEndChildren
}: Props) => {
  return (
    <View style={isWeb ? styles.tokenItemContainerWeb : styles.tokenItemContainer}>
      <View style={styles.tokenContentContainer}>
        <View style={[spacings.prSm, flexboxStyles.justifyCenter]}>
          <TokenIcon withContainer uri={img} networkId={networkId} address={address} />
        </View>

        <View style={[spacings.prSm, styles.tokenSymbol]}>
          <Text fontSize={14} numberOfLines={2}>
            {symbol}
          </Text>
          <Text fontSize={12} style={[styles.balance]} numberOfLines={1}>
            {hidePrivateValue(
              formatFloatTokenAmount(Number(balance).toFixed(balance < 1 ? 8 : 4), true, decimals)
            )}
          </Text>
        </View>
        <View style={[styles.tokenValue, flexboxStyles.flex1]}>
          <Text fontSize={12}>${hidePrivateValue(balanceUSD?.toFixed(2))}</Text>
          <Text fontSize={12} style={textStyles.highlightPrimary}>
            ${price ? hidePrivateValue(price.toFixed(price < 1 ? 5 : 2)) : '-'}
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
      {wrapperEndChildren}
    </View>
  )
}

export default React.memo(TokenItem)
