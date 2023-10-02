import { Promo } from 'ambire-common/src/hooks/useRewards/types'
import React from 'react'
import { Linking, TouchableOpacity } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BannerIcon from '@common/assets/svg/BannerIcon/BannerIcon'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

import styles, { BANNER_HEIGHT, BANNER_WIDTH } from './styles'

// Matches any string that starts with ${{ and ends with }}. This pattern is
// used to split the `text` string into an array of substrings, where each
// substring is either a string that matches the pattern or a string that does
// not match the pattern.
// Disable eslint rule, to re-use it as is from the web app.
// eslint-disable-next-line prefer-regex-literals
const pattern = new RegExp(/\${{(\w+)}}/, 'gi')

interface Props {
  data: Promo
}

const Banner: React.FC<Props> = ({ data }) => {
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const split = data.text.split(pattern)

  // Iterates over the `resources` and creates an anchor tag for each key-value
  // pair. The key is used as a unique identifier for each anchor tag and the
  // label and href properties are used to create the text and link for each
  // anchor tag, respectively. The resulting object is an associative array of
  // anchor tags, where the keys are the same as the keys in `resources`
  const links = Object.entries(data.resources).reduce((anchors, [key, { label, href } = {}]) => {
    const anc = (
      <Text
        weight="regular"
        fontSize={16}
        color={colors.malibu}
        key={key}
        onPress={() => Linking.openURL(href)}
      >
        {label}
      </Text>
    )

    anchors[key] = anc
    return anchors
  }, {})

  return (
    <>
      <TouchableOpacity
        // @ts-ignore mismatched types, but all good
        onPress={openBottomSheet}
        style={[styles.button]}
      >
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
          {split.map((x) => links[x] || x)}
        </Text>
      </BottomSheet>
    </>
  )
}

export default React.memo(Banner)
