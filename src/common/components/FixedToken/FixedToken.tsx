import React from 'react'
import { View } from 'react-native'

import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'

import getStyles from './styles'

interface Props {
  address: string
  chainId: bigint
  symbol: string
  /** Shown under the symbol, e.g. the network the token is on. */
  subtitle: string
}

/** A token laid out like a closed token select, for a field whose token can't be changed. */
const FixedToken = ({ address, chainId, symbol, subtitle }: Props) => {
  const { styles } = useTheme(getStyles)

  return (
    <View style={styles.container}>
      <TokenIcon
        containerHeight={28}
        containerWidth={28}
        width={24}
        height={24}
        networkSize={12}
        withContainer
        withNetworkIcon
        address={address}
        chainId={chainId}
      />
      <View style={styles.label}>
        <Text fontSize={isMobile ? 14 : 16} weight="semiBold" numberOfLines={1}>
          {symbol}
        </Text>
        <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  )
}

export default React.memo(FixedToken)
