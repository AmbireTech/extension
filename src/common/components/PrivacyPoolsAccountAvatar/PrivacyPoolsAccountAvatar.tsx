import React, { FC } from 'react'
import { Image, ImageSourcePropType, View, ViewStyle } from 'react-native'

import privacyPoolsAvatarBackground from '@common/assets/images/privacy-pools-avatar-background.png'
import PrivacyPoolsAvatarShieldIcon from '@common/assets/svg/PrivacyPoolsAvatarShieldIcon'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  size?: number
  style?: ViewStyle
}

/** The shield's width and height relative to the avatar, as in the design */
const SHIELD_WIDTH_RATIO = 0.6
const SHIELD_ASPECT_RATIO = 26.8933 / 24
/** The design leaves 18% above the shield and 15% below it, so it sits a bit below the center */
const SHIELD_TOP_MARGIN_RATIO = 0.18 - 0.15

/** Avatar of a Privacy Pools account, which has no address to draw a regular one from. */
const PrivacyPoolsAccountAvatar: FC<Props> = ({ size = 40, style }) => {
  const shieldWidth = size * SHIELD_WIDTH_RATIO

  return (
    <View
      style={[
        flexbox.alignCenter,
        flexbox.justifyCenter,
        { width: size, height: size, borderRadius: size / 2, overflow: 'hidden' },
        style
      ]}
    >
      <Image
        source={privacyPoolsAvatarBackground as ImageSourcePropType}
        style={{ position: 'absolute', width: size, height: size }}
      />
      {/* A View is positioned on web, so it is drawn over the absolute image, unlike a bare Svg */}
      <View style={{ marginTop: size * SHIELD_TOP_MARGIN_RATIO }}>
        <PrivacyPoolsAvatarShieldIcon
          width={shieldWidth}
          height={shieldWidth * SHIELD_ASPECT_RATIO}
        />
      </View>
    </View>
  )
}

export default React.memo(PrivacyPoolsAccountAvatar)
