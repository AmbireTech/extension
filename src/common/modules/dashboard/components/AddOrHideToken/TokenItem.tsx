import { Token } from 'ambire-common/src/hooks/usePortfolio'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import { Ionicons } from '@expo/vector-icons'

interface Props extends Token {
  isHidden: boolean
  onPress?: () => void
}

const TokenItem: React.FC<Props> = ({
  tokenImageUrl,
  address,
  network,
  symbol,
  onPress,
  isHidden
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[flexboxStyles.directionRow, spacings.mb, flexboxStyles.justifyCenter]}
    >
      <TokenIcon withContainer uri={tokenImageUrl} address={address} networkId={network} />

      <View style={[spacings.mlTy, flexboxStyles.flex1, flexboxStyles.justifyCenter]}>
        {/* TODO: Display network */}
        <Text>{symbol}</Text>
      </View>
      <Ionicons
        name={isHidden ? 'ios-eye-off' : 'ios-eye'}
        style={spacings.mlSm}
        size={30}
        color={isHidden ? colors.radicalRed : colors.turquoise}
      />
    </TouchableOpacity>
  )
}

export default React.memo(TokenItem)
