import React, { FC } from 'react'
import { Image, ImageSourcePropType, View, ViewStyle } from 'react-native'

import { PrivacyProviderId } from '@ambire-common/interfaces/privateAccount'
import privacyPoolsAvatarBackground from '@common/assets/images/privacy-pools-avatar-background.png'
import PrivacyPoolsAvatarShieldIcon from '@common/assets/svg/PrivacyPoolsAvatarShieldIcon'
import TornadoCashIcon from '@common/assets/svg/TornadoCashIcon'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  providerId: PrivacyProviderId
  size?: number
  style?: ViewStyle
}

/** The shield's width and height relative to the avatar, as in the design */
const SHIELD_WIDTH_RATIO = 0.6
const SHIELD_ASPECT_RATIO = 26.8933 / 24
/** The design leaves 18% above the shield and 15% below it, so it sits a bit below the center */
const SHIELD_TOP_MARGIN_RATIO = 0.18 - 0.15
/**
 * The Tornado Cash icon's size relative to the avatar. Its viewBox pads the wheel (40 of 46), so the
 * wheel itself is ~45% of the avatar, as big as the Privacy Pools logo inside the shield
 */
const TORNADO_CASH_LOGO_SIZE_RATIO = 0.52
/** The avatar's background has the same colors in both themes, so its logo does too */
const TORNADO_CASH_LOGO_COLOR = '#FFFFFF'

/**
 * Avatar of a private account, which has no address to draw a regular one from: the same
 * background for every provider, with the provider's logo in the middle.
 */
const PrivateAccountAvatar: FC<Props> = ({ providerId, size = 40, style }) => {
  const shieldWidth = size * SHIELD_WIDTH_RATIO
  const tornadoCashLogoSize = size * TORNADO_CASH_LOGO_SIZE_RATIO

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
      {providerId === 'tornadoCash' ? (
        <View>
          <TornadoCashIcon
            width={tornadoCashLogoSize}
            height={tornadoCashLogoSize}
            color={TORNADO_CASH_LOGO_COLOR}
          />
        </View>
      ) : (
        <View style={{ marginTop: size * SHIELD_TOP_MARGIN_RATIO }}>
          <PrivacyPoolsAvatarShieldIcon
            width={shieldWidth}
            height={shieldWidth * SHIELD_ASPECT_RATIO}
          />
        </View>
      )}
    </View>
  )
}

export default React.memo(PrivateAccountAvatar)
