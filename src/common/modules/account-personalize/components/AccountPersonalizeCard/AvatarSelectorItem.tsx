import React from 'react'
import { Image, TouchableOpacity, View } from 'react-native'

import CheckIcon from '@common/assets/svg/CheckIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

interface Props {
  id: string
  isSelected: boolean
  source: any
  setSelectedAvatar: (id: string) => void
}

const AvatarsSelectorItem: React.FC<Props> = ({ id, isSelected, source, setSelectedAvatar }) => {
  const { styles, theme } = useTheme(getStyles)

  return (
    <TouchableOpacity activeOpacity={1} onPress={() => setSelectedAvatar(id)}>
      <View style={spacings.mrTy} key={id}>
        <Image source={source} style={styles.pfpSelectorItem} resizeMode="contain" />
        {isSelected && (
          <CheckIcon
            width={14}
            height={14}
            color={theme.successDecorative}
            style={styles.checkIcon}
          />
        )}
      </View>
    </TouchableOpacity>
  )
}

export default AvatarsSelectorItem
