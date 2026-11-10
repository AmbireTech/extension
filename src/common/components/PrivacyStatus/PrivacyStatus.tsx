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
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { getPrivacyStatusText } from './helpers'
import PrivacyModal from './PrivacyModal'
import { PrivacyStatusProps } from './types'

/**
 * How well a Privacy Pools transfer hides, in one line: how many deposits hide it, or that nothing
 * could be checked yet, colored by how weak its privacy is. Pressing it opens every suggestion
 * with its fix.
 */
const PrivacyStatus: FC<PrivacyStatusProps> = (props) => {
  const { stage, rating, leaks, cover, style } = props
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()
  const handleOpen = useCallback(() => openSheet(), [openSheet])

  const isTraceable = rating === 'traceable'
  const hasSuggestions = !!leaks.length
  // On a send, few deposits to hide among read as a warning even without a leak, as does no check
  // at all. A deposit's amount can still be sent out in other amounts, so for it they are only info.
  const isWarning =
    !isTraceable &&
    (rating === 'weak' ||
      (stage === 'send' && (rating === 'unchecked' || cover < PRIVACY_POOLS_MIN_REASSURING_COVER)))
  // A suggestion that neither breaks nor weakens privacy still stands out, so it isn't missed
  const iconColor = isTraceable
    ? theme.errorDecorative
    : isWarning
      ? theme.warningDecorative
      : hasSuggestions
        ? theme.infoDecorative
        : theme.iconSecondary
  const StatusIcon = isTraceable || isWarning ? WarningIcon : InfoIcon
  const textAppearance = isTraceable
    ? 'errorText'
    : isWarning
      ? 'warningText'
      : hasSuggestions
        ? 'infoText'
        : 'secondaryText'
  const suggestionsText =
    leaks.length === 1 ? t('1 suggestion') : t('{{count}} suggestions', { count: leaks.length })

  return (
    <View style={style}>
      <HoverablePressable
        testID={`privacy-pools-${stage}-privacy-status`}
        onPress={handleOpen}
        style={[flexbox.directionRow, flexbox.alignCenter]}
      >
        <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1]}>
          <StatusIcon width={16} height={16} color={iconColor} style={spacings.mrMi} />
          <Text fontSize={12} appearance="secondaryText" numberOfLines={1} style={flexbox.flex1}>
            <Text fontSize={12} appearance={textAppearance} underline>
              {getPrivacyStatusText(t, rating, cover)}
              {hasSuggestions && ` · ${suggestionsText}`}
            </Text>
          </Text>
        </View>
      </HoverablePressable>
      <PrivacyModal {...props} sheetRef={sheetRef} closeBottomSheet={closeSheet} />
    </View>
  )
}

export default React.memo(PrivacyStatus)
