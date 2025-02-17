import { CollectibleWithIsHiddenFlag } from 'ambire-common/src/hooks/usePortfolio'
import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import CollectibleIcon from '@common/components/CollectibleIcon'
import Text from '@common/components/Text'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { Ionicons } from '@expo/vector-icons'

interface Props extends Partial<CollectibleWithIsHiddenFlag> {
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
      <CollectibleIcon uri={assetImg} width={15} height={15} style={{ borderRadius: 50 }} />

      <View style={[spacings.mlTy, flexboxStyles.flex1, flexboxStyles.justifyCenter]}>
        <Text>{assetName}</Text>
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

export default React.memo(HideCollectibleListItem)
