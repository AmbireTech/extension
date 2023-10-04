import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import NetworkIcon from '@common/components/NetworkIcon'
import { NetworkIconNameType } from '@common/components/NetworkIcon/NetworkIcon'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import colors from '@common/styles/colors'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

type Props = {
  idx: number
  name: string
  iconName: NetworkIconNameType
  isActive: boolean
  onPress: (idx: number) => void
}

const NetworkChangerItem = ({ idx, name, iconName, isActive, onPress }: Props) => {
  const handlePress = () => {
    !!onPress && onPress(idx)
  }

  return (
    <TouchableOpacity
      style={[styles.networkBtnContainer, isActive && isWeb && styles.networkBtnContainerActiveWeb]}
      onPress={handlePress}
      disabled={isActive}
      activeOpacity={0.6}
    >
      <View style={styles.networkBtnIcon}>
        <NetworkIcon name={iconName} width={40} height={40} />
      </View>
      <Text
        weight="regular"
        color={isActive ? colors.titan : colors.titan_50}
        style={flexboxStyles.flex1}
        numberOfLines={1}
      >
        {name}
      </Text>
    </TouchableOpacity>
  )
}

export default React.memo(NetworkChangerItem)
