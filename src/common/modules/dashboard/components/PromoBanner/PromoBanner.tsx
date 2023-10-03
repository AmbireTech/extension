import React, { useCallback } from 'react'
import { Linking, TouchableOpacity } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BannerIcon from '@common/assets/svg/BannerIcon/BannerIcon'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import useRewards from '@common/hooks/useRewards'
import useStorage from '@common/hooks/useStorage'
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

interface Props {}

const PromoBanner: React.FC<Props> = () => {
  const {
    promoBannerIdsRead,
    setPromoBannerIdsRead,
    rewards: { promo }
  } = useRewards()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const handleOpen = useCallback(() => {
    if (promo?.id) {
      // @ts-ignore mismatched types, but all good
      setPromoBannerIdsRead((ids) => [...ids, promo?.id])
    }

    openBottomSheet()
  }, [promo?.id, openBottomSheet, setPromoBannerIdsRead])

  if (!promo) {
    return null
  }

  // Iterates over the `resources` and creates an anchor tag for each key-value
  // pair. The key is used as a unique identifier for each anchor tag and the
  // label and href properties are used to create the text and link for each
  // anchor tag, respectively. The resulting object is an associative array of
  // anchor tags, where the keys are the same as the keys in `resources`
  const links: { [key: string]: JSX.Element } = Object.entries(promo.resources).reduce(
    (
      anchors: { [key: string]: JSX.Element },
      // The default value ensures that the destructured object always has
      // a `label` and `href` property, even if they are undefined,
      // otherwise TypeScript complains about the missing properties.
      [key = '', { label = '', href = '' } = { label: '', href: '' }]
    ) => {
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

      return { ...anchors, [key]: anc }
    },
    {}
  )

  const isRead = promoBannerIdsRead?.includes(promo?.id)
  const split = promo.text.split(pattern)

  return (
    <>
      <TouchableOpacity
        // @ts-ignore mismatched types, but all good
        onPress={handleOpen}
        style={styles.button}
      >
        <>
          <BannerIcon
            width={BANNER_WIDTH}
            height={BANNER_HEIGHT}
            style={styles.bannerIcon}
            color={isRead ? colors.chetwode : undefined}
          />
          <Text fontSize={28} style={styles.emoji}>
            {promo.icon}
          </Text>
        </>
      </TouchableOpacity>
      <BottomSheet id="banner" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
        <Text fontSize={40} style={[text.center, spacings.mt, spacings.mb]}>
          {promo.icon}
        </Text>
        <Text fontSize={20} weight="medium" style={spacings.mbSm}>
          {promo.title}
        </Text>

        <Text fontSize={16} style={{ marginBottom: 100 }} color={colors.titan}>
          {split.map((x) => links[x] || x)}
        </Text>
      </BottomSheet>
    </>
  )
}

export default React.memo(PromoBanner)
