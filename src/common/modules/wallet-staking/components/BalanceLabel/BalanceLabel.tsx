import React from 'react'
import { View } from 'react-native'

import WalletIcon from '@common/assets/svg/WalletIcon'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

interface Props {
  balanceLabel: string
  tokenSymbol: string
}

/** What the account holds of the token being staked, shown as the amount field's label. */
const BalanceLabel = ({ balanceLabel, tokenSymbol }: Props) => {
  const { styles, theme } = useTheme(getStyles)

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, styles.balanceLabel]}>
      <WalletIcon width={20} height={20} color={theme.tertiaryText} />
      <Text
        numberOfLines={1}
        fontSize={12}
        weight="medium"
        appearance="tertiaryText"
        ellipsizeMode="tail"
        style={spacings.mlMi}
      >
        {balanceLabel} {tokenSymbol}
      </Text>
    </View>
  )
}

export default React.memo(BalanceLabel)
