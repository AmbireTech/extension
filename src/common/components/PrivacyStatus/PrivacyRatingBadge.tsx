import React, { FC } from 'react'
import { ViewStyle } from 'react-native'

import { PrivacyPoolsRating } from '@ambire-common/interfaces/privacyPools'
import InfoIcon from '@common/assets/svg/InfoIcon'
import Badge from '@common/components/Badge'
import HoverablePressable from '@common/components/HoverablePressable'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

type Props = {
  rating: PrivacyPoolsRating
  /** Opens the details. Adds an info icon to show the badge can be pressed. */
  onPress?: () => void
  style?: ViewStyle
}

const ICON_SIZE = 12

/** Flags a Privacy Pools transfer whose privacy is weak or broken. Renders nothing otherwise. */
const PrivacyRatingBadge: FC<Props> = ({ rating, onPress, style }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()

  if (rating !== 'traceable' && rating !== 'weak') return null

  const isTraceable = rating === 'traceable'
  const badge = (
    <Badge
      type={isTraceable ? 'error' : 'warning'}
      text={isTraceable ? t('Traceable') : t('Weak privacy')}
      style={onPress ? undefined : style}
    >
      {!!onPress && (
        <InfoIcon
          width={ICON_SIZE}
          height={ICON_SIZE}
          color={isTraceable ? theme.errorText : theme.warningText}
          // Badge spaces only its own tooltip icon from the text
          style={spacings.mlMi}
        />
      )}
    </Badge>
  )

  if (!onPress) return badge

  return (
    <HoverablePressable testID="privacy-rating-badge" onPress={onPress} style={style}>
      {badge}
    </HoverablePressable>
  )
}

export default React.memo(PrivacyRatingBadge)
