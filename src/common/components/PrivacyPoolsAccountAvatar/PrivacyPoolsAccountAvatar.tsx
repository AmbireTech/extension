import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import ShieldInvisibilityIcon from '@common/assets/svg/ShieldInvisibilityIcon'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  size?: number
  style?: ViewStyle
}

/**
 * Stands in for the address-based avatar of a regular account: a Privacy Pools account has no
 * address to draw one from.
 */
const PrivacyPoolsAccountAvatar: FC<Props> = ({ size = 40, style }) => {
  const { theme } = useTheme()
  const iconSize = Math.round(size * 0.55)

  return (
    <View
      style={[
        flexbox.alignCenter,
        flexbox.justifyCenter,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.primary
        },
        style
      ]}
    >
      <ShieldInvisibilityIcon
        width={iconSize}
        height={Math.round(iconSize * (50 / 44))}
        color="#FFFFFF"
      />
    </View>
  )
}

export default React.memo(PrivacyPoolsAccountAvatar)
