import { TokenWithIsHiddenFlag } from 'ambire-common/src/hooks/usePortfolio'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { Ionicons } from '@expo/vector-icons'

interface Props extends Partial<TokenWithIsHiddenFlag> {
  isHidden: boolean
  onPress?: () => void
}

const HideTokenListItem: React.FC<Props> = ({
  tokenImageUrl,
  address,
  symbol,
  network,
  onPress,
  isHidden
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
      <Ionicons
        name={isHidden ? 'eye-off' : 'eye'}
        style={spacings.mlSm}
        size={26}
        color={isHidden ? colors.radicalRed : colors.turquoise}
      />
    </TouchableOpacity>
  )
}

export default React.memo(HideTokenListItem)
