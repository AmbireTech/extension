import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native'

import ringingPhone from '@common/assets/images/ringing-phone.gif'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { PILL_TEXT_COLOR } from './constants'

type Props = {
  onPress: () => void
}

// Plain `View`s with a raw `onClick` here (react-native-web forwards it straight to the
// DOM node) instead of nested `Pressable`s - this component lives entirely under
// `src/web/`, so that's safe. A `Pressable` always attaches its own hover tracking with
// `contain: true` hardcoded, which broadcasts a bubbling lock/unlock event to any
// ancestor `Pressable` whenever it's entered/left. Since this content sits inside the
// slide-reveal layer whose position keeps shifting under a stationary cursor while the
// outer pill's hover animation runs, a nested `Pressable` here kept re-triggering that
// lock/unlock exchange and fighting the outer hover state into a rapid open/close loop.
const PillContent: React.FC<Props> = ({ onPress }) => {
  const { t } = useTranslation()

  return (
    <View
      // @ts-expect-error onClick exists for the React Native Web component
      onClick={onPress}
      style={[StyleSheet.absoluteFill, flexbox.directionRow, flexbox.alignCenter, spacings.phSm]}
    >
      <Image
        source={ringingPhone as ImageSourcePropType}
        style={{ width: 28, height: 28 }}
        resizeMode="contain"
      />
      <Text
        weight="medium"
        fontSize={12}
        color={PILL_TEXT_COLOR}
        numberOfLines={1}
        style={[spacings.mlTy, flexbox.flex1]}
      >
        {t('Ambire Mobile is live!')}
      </Text>
      <View>
        <RightArrowIcon width={6} height={11} color={PILL_TEXT_COLOR} />
      </View>
    </View>
  )
}

export default React.memo(PillContent)
