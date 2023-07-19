import { TokenWithIsHiddenFlag } from 'ambire-common/src/hooks/usePortfolio'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { AntDesign } from '@expo/vector-icons'

interface Props extends Partial<TokenWithIsHiddenFlag> {
  onPress?: () => void
}

const ExtraTokensListItem: React.FC<Props> = ({
  tokenImageUrl,
  address,
  symbol,
  network,
  onPress
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[flexboxStyles.directionRow, spacings.pvTy, flexboxStyles.alignCenter]}
    >
      <TokenIcon withContainer uri={tokenImageUrl} address={address} networkId={network} />

      <View style={[spacings.mlTy, flexboxStyles.flex1, flexboxStyles.justifyCenter]}>
        <Text>
          {symbol} ({network})
        </Text>
      </View>
      <AntDesign name="minussquareo" size={24} color={colors.titan} />
    </TouchableOpacity>
  )
}

export default React.memo(ExtraTokensListItem)
