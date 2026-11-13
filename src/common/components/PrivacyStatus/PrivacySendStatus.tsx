import React, { FC, useCallback } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { PRIVACY_POOLS_MIN_REASSURING_COVER } from '@ambire-common/consts/privacyPools'
import { PrivacyPoolsRating } from '@ambire-common/interfaces/privacyPools'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Badge from '@common/components/Badge'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { getLeakTextAppearance, getPrivacyStatusText, getPrivacyToneColors } from './helpers'
import PrivacyModal from './PrivacyModal'
import { PrivacyStatusProps, PrivacyTone } from './types'

type Props = Omit<PrivacyStatusProps, 'stage'>

const COVER_ICON_SIZE = 16
const SUGGESTIONS_ICON_SIZE = 12

/** The tone of the deposit count. Not counted at all reads as a warning rather than as no cover. */
const getCoverTone = (rating: PrivacyPoolsRating, cover: number): PrivacyTone => {
  if (rating === 'unchecked') return 'warning'
  if (cover === 0) return 'error'
  if (cover < PRIVACY_POOLS_MIN_REASSURING_COVER) return 'warning'

  return 'neutral'
}

/**
 * The Send form's privacy line: how many recent deposits hide the transfer, or that nothing could
 * be checked yet, and how many privacy suggestions it has. Both open the privacy details with
 * every fix. Only the deposit count colors the count, as the suggestions show apart from it.
 */
const PrivacySendStatus: FC<Props> = (props) => {
  const { rating, leaks, cover, style } = props
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()
  const handleOpen = useCallback(() => openSheet(), [openSheet])

  const coverTone = getCoverTone(rating, cover)
  const { textAppearance: coverAppearance, iconColor: coverIconColor } = getPrivacyToneColors(
    theme,
    coverTone
  )
  const CoverIcon = coverTone === 'neutral' ? InfoIcon : WarningIcon
  // Leaks come worst first
  const worstLeak = leaks[0]
  const SuggestionsIcon = worstLeak?.type === 'info' ? InfoIcon : WarningIcon

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween, style]}>
      <HoverablePressable
        testID="privacy-pools-send-privacy-cover"
        onPress={handleOpen}
        style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1, spacings.mrMd]}
      >
        <CoverIcon
          width={COVER_ICON_SIZE}
          height={COVER_ICON_SIZE}
          color={coverIconColor}
          style={spacings.mrTy}
        />
        <Text
          fontSize={12}
          appearance={coverAppearance}
          numberOfLines={1}
          underline
          style={flexbox.flex1}
        >
          {getPrivacyStatusText(t, rating, cover)}
        </Text>
      </HoverablePressable>
      {!!worstLeak && (
        <HoverablePressable testID="privacy-pools-send-privacy-suggestions" onPress={handleOpen}>
          <Badge
            type={worstLeak.type}
            text={
              leaks.length === 1
                ? t('1 privacy suggestion')
                : t('{{count}} privacy suggestions', { count: leaks.length })
            }
            isIconLeading
          >
            <SuggestionsIcon
              width={SUGGESTIONS_ICON_SIZE}
              height={SUGGESTIONS_ICON_SIZE}
              color={theme[getLeakTextAppearance(worstLeak.type)]}
              strokeWidth="2"
            />
          </Badge>
        </HoverablePressable>
      )}
      <PrivacyModal {...props} stage="send" sheetRef={sheetRef} closeBottomSheet={closeSheet} />
    </View>
  )
}

export default React.memo(PrivacySendStatus)
