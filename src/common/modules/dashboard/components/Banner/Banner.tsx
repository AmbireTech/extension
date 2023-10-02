import React from 'react'
import { TouchableOpacity } from 'react-native'

import BannerIcon from '@common/assets/svg/BannerIcon/BannerIcon'

import styles from './styles'

const Banner = () => {
  const handlePress = () => {
    // TODO: Bottom sheet
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.button}>
      <BannerIcon />
    </TouchableOpacity>
  )
}

export default React.memo(Banner)
