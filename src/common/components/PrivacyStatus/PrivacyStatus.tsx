import React, { FC, useCallback } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { PRIVACY_POOLS_MIN_REASSURING_COVER } from '@ambire-common/consts/privacyPools'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { getPrivacyStatusText } from './helpers'
import PrivacyModal from './PrivacyModal'
import PrivacyRatingBadge from './PrivacyRatingBadge'
import { PrivacyStatusProps } from './types'

/**
 * How well a Privacy Pools transfer hides: a badge when something weakens or breaks its privacy,
 * and how many deposits hide it, or that nothing could be checked yet. Pressing it opens every
 * suggestion with its fix. A compact status is one line without the badge.
 */
const PrivacyStatus: FC<PrivacyStatusProps> = (props) => {
  const { stage, rating, leaks, cover, isCompact, style } = props
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()
  const handleOpen = useCallback(() => openSheet(), [openSheet])

  const isTraceable = rating === 'traceable'
  // On a send, few deposits to hide among read as a warning even without a leak, as does no check
  // at all. A deposit's amount can still be sent out in other amounts, so for it they are only info.
  const isWarning =
    !isTraceable &&
    (rating === 'weak' ||
      (stage === 'send' && (rating === 'unchecked' || cover < PRIVACY_POOLS_MIN_REASSURING_COVER)))
  const iconColor = isTraceable
    ? theme.errorDecorative
    : isWarning
      ? theme.warningDecorative
      : theme.iconSecondary
  const StatusIcon = isTraceable || isWarning ? WarningIcon : InfoIcon
  const textAppearance = isTraceable ? 'errorText' : isWarning ? 'warningText' : 'secondaryText'

  return (
    <View style={style}>
      <HoverablePressable
        testID={`privacy-pools-${stage}-privacy-status`}
        onPress={handleOpen}
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          !isCompact && flexbox.wrap,
          { gap: SPACING_TY }
        ]}
      >
        {!isCompact && <PrivacyRatingBadge rating={rating} />}
        <View style={[flexbox.directionRow, flexbox.alignCenter, isCompact && flexbox.flex1]}>
          <StatusIcon width={16} height={16} color={iconColor} style={spacings.mrMi} />
          <Text
            fontSize={12}
            appearance="secondaryText"
            numberOfLines={isCompact ? 1 : undefined}
            style={isCompact ? flexbox.flex1 : undefined}
          >
            <Text fontSize={12} appearance={textAppearance} underline>
              {getPrivacyStatusText(t, stage, rating, cover)}
            </Text>
          </Text>
        </View>
        {!isCompact && !!leaks.length && (
          <Text fontSize={12} appearance="secondaryText">
            {leaks.length === 1
              ? t('1 suggestion')
              : t('{{count}} suggestions', { count: leaks.length })}
          </Text>
        )}
      </HoverablePressable>
      <PrivacyModal {...props} sheetRef={sheetRef} closeBottomSheet={closeSheet} />
    </View>
  )
}

export default React.memo(PrivacyStatus)
