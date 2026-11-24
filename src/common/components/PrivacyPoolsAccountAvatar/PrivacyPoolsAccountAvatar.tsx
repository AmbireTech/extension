import React, { FC } from 'react'
import { Image, ImageSourcePropType, View, ViewStyle } from 'react-native'

import privacyPoolsAvatarBackground from '@common/assets/images/privacy-pools-avatar-background.png'
import PrivacyPoolsAvatarShieldIcon from '@common/assets/svg/PrivacyPoolsAvatarShieldIcon'

type Props = {
  size?: number
  style?: ViewStyle
}

/** Avatar of a Privacy Pools account, which has no address to draw a regular one from. */
const PrivacyPoolsAccountAvatar: FC<Props> = ({ size = 40, style }) => (
  <View style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }, style]}>
    <Image
      source={privacyPoolsAvatarBackground as ImageSourcePropType}
      style={{ position: 'absolute', width: size, height: size }}
    />
    {/* A View is positioned on web, so it is drawn over the absolute image, unlike a bare Svg.
    The shield is drawn in the avatar's own frame, so it is as big as the avatar */}
    <View>
      <PrivacyPoolsAvatarShieldIcon width={size} height={size} />
    </View>
  </View>
)

export default React.memo(PrivacyPoolsAccountAvatar)
