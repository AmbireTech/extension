import { TokenWithIsHiddenFlag } from 'ambire-common/src/hooks/usePortfolio'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import FastImage from '@common/components/FastImage'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import handleCollectibleUri from '@common/modules/dashboard/helpers/handleCollectibleUri'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { Ionicons } from '@expo/vector-icons'

interface Props extends Partial<TokenWithIsHiddenFlag> {
  isHidden: boolean
  onPress?: () => void
  assetImg: string
  assetName: string
}

const HideCollectibleListItem: React.FC<Props> = ({ assetImg, assetName, onPress, isHidden }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[flexboxStyles.directionRow, spacings.pvTy, flexboxStyles.alignCenter]}
    >
      <TokenIcon
        withContainer
        uri={handleCollectibleUri(assetImg)}
        address=""
        networkId="network"
      />

      <View style={[spacings.mlTy, flexboxStyles.flex1, flexboxStyles.justifyCenter]}>
        <Text>{assetName}</Text>
      </View>
      <Ionicons
        name={isHidden ? 'ios-eye-off' : 'ios-eye'}
        style={spacings.mlSm}
        size={26}
        color={isHidden ? colors.radicalRed : colors.turquoise}
      />
    </TouchableOpacity>
  )
}

export default React.memo(HideCollectibleListItem)
