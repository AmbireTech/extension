import React, { FC, useCallback, useMemo } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { PRIVACY_POOLS_MIN_REASSURING_COVER } from '@ambire-common/consts/privacyPools'
import InfoIcon from '@common/assets/svg/InfoIcon'
import WarningIcon from '@common/assets/svg/WarningIcon'
import Badge from '@common/components/Badge'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import HoverablePressable from '@common/components/HoverablePressable'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { COVER_WINDOW_DAYS, getPrivacyStatusText } from './helpers'
import PrivacyModal from './PrivacyModal'
import { PrivacyStatusProps } from './types'

type Props = Omit<PrivacyStatusProps, 'stage' | 'isCompact'>

const COVER_ICON_SIZE = 16
const SUGGESTIONS_ICON_SIZE = 12

/**
 * The Send form's privacy line: how many recent deposits hide the transfer, explained in a
 * tooltip, or that nothing could be checked yet, and how many privacy suggestions it has, which
 * opens them with their fixes. Only the deposit count colors the count, as the suggestions show
 * apart from it. Without suggestions there is nothing to open.
 */
const PrivacySendStatus: FC<Props> = (props) => {
  const { rating, leaks, cover, style } = props
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { ref: sheetRef, open: openSheet, close: closeSheet } = useModalize()
  const handleOpen = useCallback(() => openSheet(), [openSheet])

  // Not counted at all, which reads as a warning rather than as no cover
  const isUnchecked = rating === 'unchecked'
  const isCoverMissing = !isUnchecked && cover === 0
  const isCoverLow = isUnchecked || cover < PRIVACY_POOLS_MIN_REASSURING_COVER
  const coverAppearance = isCoverMissing
    ? 'errorText'
    : isCoverLow
      ? 'warningText'
      : 'secondaryText'
  const coverIconColor = isCoverMissing
    ? theme.errorDecorative
    : isCoverLow
      ? theme.warningDecorative
      : theme.iconSecondary
  const CoverIcon = isCoverLow ? WarningIcon : InfoIcon
  const hasBreakingLeak = leaks.some(({ type }) => type === 'error')
  const hasWarningLeak = leaks.some(({ type }) => type === 'warning')
  const suggestionsBadgeType = hasBreakingLeak ? 'error' : hasWarningLeak ? 'warning' : 'info'
  const suggestionsIconColor = hasBreakingLeak
    ? theme.errorText
    : hasWarningLeak
      ? theme.warningText
      : theme.infoText
  const SuggestionsIcon = hasBreakingLeak || hasWarningLeak ? WarningIcon : InfoIcon

  const coverTooltip = useMemo(
    () =>
      createGlobalTooltipDataSet({
        id: 'privacy-pools-send-cover',
        title: t('Deposits that cover you'),
        content: t(
          'Deposits made in the last {{days}} days that are large enough to pay this transfer. The more there are, the harder it is to link the transfer to you.',
          { days: COVER_WINDOW_DAYS }
        )
      }),
    [t]
  )

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifySpaceBetween, style]}>
      <View
        style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1, spacings.mrMd]}
        dataSet={isUnchecked ? undefined : coverTooltip}
      >
        <CoverIcon
          width={COVER_ICON_SIZE}
          height={COVER_ICON_SIZE}
          color={coverIconColor}
          style={spacings.mrTy}
        />
        <Text fontSize={12} appearance={coverAppearance} numberOfLines={1} style={flexbox.flex1}>
          {getPrivacyStatusText(t, rating, cover)}
        </Text>
      </View>
      {!!leaks.length && (
        <>
          <HoverablePressable testID="privacy-pools-send-privacy-suggestions" onPress={handleOpen}>
            <Badge
              type={suggestionsBadgeType}
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
                color={suggestionsIconColor}
                strokeWidth="2"
              />
            </Badge>
          </HoverablePressable>
          <PrivacyModal {...props} stage="send" sheetRef={sheetRef} closeBottomSheet={closeSheet} />
        </>
      )}
    </View>
  )
}

export default React.memo(PrivacySendStatus)
