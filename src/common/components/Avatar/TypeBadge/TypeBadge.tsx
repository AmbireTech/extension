import React, { FC } from 'react'
import { Animated, ViewStyle } from 'react-native'

import SafeIcon from '@common/assets/svg/SafeIcon'
import BADGE_PRESETS from '@common/components/BadgeWithPreset/presets'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MI } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'

/** About as tall as the smart account badge's label with its padding, for each avatar size */
const SAFE_BADGE_ICON_SIZES = { big: 18, small: 16 }

interface Props {
  /** The account the badge sits on, which is what makes its tooltip anchor unique */
  address: string
  smartAccountType?: 'Ambire' | 'Safe'
  size?: 'big' | 'small'
  showTooltip?: boolean
  /**
   * The color of the ring that sets the badge apart from the avatar, which should be the one
   * of what the avatar sits on. Can be animated, to follow a background that changes on hover
   */
  ringColor?: ViewStyle['borderColor'] | Animated.AnimatedInterpolation<string>
}

const TypeBadge: FC<Props> = ({
  address,
  smartAccountType,
  size,
  showTooltip = false,
  ringColor
}) => {
  const { t } = useTranslation()
  const { theme, themeType } = useTheme()
  const badgePreset = BADGE_PRESETS['smart-account']
  const tooltipId = `account-type-badge-${address}`

  if (!smartAccountType) return null

  const badgeRingColor =
    ringColor ??
    (themeType === THEME_TYPES.DARK ? theme.secondaryBackground : theme.primaryBackground)

  if (smartAccountType === 'Ambire') {
    return (
      <Animated.View
        dataSet={createGlobalTooltipDataSet({
          id: tooltipId,
          content: badgePreset.tooltipText,
          hidden: !showTooltip
        })}
        style={{
          position: 'absolute',
          left: size === 'big' ? -SPACING_MI / 2 : -SPACING_MI,
          top: size === 'big' ? -SPACING_MI / 2 : -SPACING_MI,
          paddingHorizontal: 3,
          paddingVertical: 2,
          backgroundColor: theme.successDecorative,
          zIndex: 2,
          borderRadius: 50,
          borderWidth: size === 'big' ? 3 : 2,
          borderColor: badgeRingColor
        }}
      >
        <Text
          // Light on the green in both themes, where the primary background would be dark
          color={themeType === THEME_TYPES.DARK ? theme.primaryText : theme.primaryBackground}
          weight="semiBold"
          fontSize={size === 'big' ? 10 : 9}
        >
          SA
        </Text>
      </Animated.View>
    )
  }

  const safeIconSize = SAFE_BADGE_ICON_SIZES[size === 'big' ? 'big' : 'small']

  return (
    <Animated.View
      dataSet={createGlobalTooltipDataSet({
        id: tooltipId,
        content: t(
          'Gnosis Safe accounts offer a secure way to store your assets on multisig smart contract accounts. You can import and manage Safe accounts on Ambire.'
        ),
        hidden: !showTooltip
      })}
      style={{
        position: 'absolute',
        // Placed and ringed like the smart account badge, so the two read the same size
        left: size === 'big' ? -SPACING_MI / 2 : -SPACING_MI,
        top: size === 'big' ? -SPACING_MI / 2 : -SPACING_MI,
        zIndex: 2,
        borderRadius: 50,
        borderWidth: size === 'big' ? 3 : 2,
        borderColor: badgeRingColor,
        // Filled like the ring, so the avatar does not show through where the edge of the
        // icon's disc and the ring's inner edge are rounded to different pixels
        backgroundColor: badgeRingColor
      }}
    >
      {/* The icon is a green disc of its own, so it needs no background around it */}
      <SafeIcon width={safeIconSize} height={safeIconSize} />
    </Animated.View>
  )
}

export default React.memo(TypeBadge)
