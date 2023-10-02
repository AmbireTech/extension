import { Promo } from 'ambire-common/src/hooks/useRewards/types'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BannerIcon from '@common/assets/svg/BannerIcon/BannerIcon'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

import styles, { BANNER_HEIGHT, BANNER_WIDTH } from './styles'

interface Props {
  data: Promo
}

const Banner: React.FC<Props> = ({ data }) => {
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  return (
    <>
      <TouchableOpacity onPress={openBottomSheet} style={[styles.button]}>
        <>
          <BannerIcon
            width={BANNER_WIDTH}
            height={BANNER_HEIGHT}
            style={{ position: 'absolute' }}
          />
          <Text fontSize={30}>{data.icon}</Text>
        </>
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
          {data.icon}
        </Text>
        <Text fontSize={20} weight="medium" style={spacings.mbSm}>
          {data.title}
        </Text>
        <Text fontSize={16} style={{ marginBottom: 100 }} color={colors.titan}>
          {data.text}
        </Text>
      </BottomSheet>
    </>
  )
}

export default React.memo(Banner)
