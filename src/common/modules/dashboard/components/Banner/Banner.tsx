import React from 'react'
import { TouchableOpacity } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BannerIcon from '@common/assets/svg/BannerIcon/BannerIcon'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

import styles from './styles'

const Banner = () => {
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const handlePress = () => {
    // TODO: Bottom sheet
    openBottomSheet()
  }

  return (
    <>
      <TouchableOpacity onPress={handlePress} style={styles.button}>
        <BannerIcon />
      </TouchableOpacity>
      <BottomSheet
        id="banner"
        sheetRef={sheetRef}
        closeBottomSheet={closeBottomSheet}
        onClosed={() => {
          // Mark as read
        }}
      >
        <Text fontSize={40} style={[text.center, spacings.mt, spacings.mb]}>
          🍌
        </Text>
        <Text fontSize={20} weight="medium" style={spacings.mbSm}>
          Install the Ambire mobile app with $20 gas tank on us!
        </Text>
        <Text fontSize={16} style={{ marginBottom: 100 }} color={colors.titan}>
          As an early user of the Ambire app we exclusively invite you to download the Ambire mobile
          app for iOS and Android 1 week before the official launch and receive $20 in your gas
          tank. 🔗iPhone 🔗Android
        </Text>
      </BottomSheet>
    </>
  )
}

export default React.memo(Banner)
