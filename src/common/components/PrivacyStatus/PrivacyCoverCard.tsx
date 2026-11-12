import React, { FC } from 'react'
import { View, ViewStyle } from 'react-native'

import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import { COVER_WINDOW_DAYS } from './helpers'
import PrivacyCommunityNote from './PrivacyCommunityNote'
import PrivacyCoverShield from './PrivacyCoverShield'
import { PrivacySeverity, PrivacyStage } from './types'

type Props = {
  stage: PrivacyStage
  cover: number
  severity: PrivacySeverity
  style?: ViewStyle
}

const CAPTION_LETTER_SPACING = 0.8
const UNCOVERED_BACKGROUND_OPACITY = 0.06
const UNCOVERED_BORDER_OPACITY = 0.24

const COVER_EXPLANATIONS = {
  deposit: 'More deposits of this amount make yours harder to find.',
  send: 'More deposits that can pay this transfer make yours harder to find.'
} as const

/**
 * How many recent deposits hide a Privacy Pools transfer, as a number next to a shield of dots
 * that light up with it, with the note that privacy grows with the pool. Stays neutral when the
 * privacy looks fine and takes the warning or error color otherwise. The card turns slightly yellow
 * when no deposit hides the transfer.
 */
const PrivacyCoverCard: FC<Props> = ({ stage, cover, severity, style }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { youColor, numberColor } = {
    error: { youColor: theme.errorDecorative, numberColor: theme.errorText },
    warning: { youColor: theme.warningDecorative, numberColor: theme.warningText },
    ok: { youColor: theme.primaryText, numberColor: theme.primaryText }
  }[severity]
  const isUncovered = cover === 0

  return (
    <View
      testID={`privacy-pools-${stage}-cover-card`}
      style={[
        {
          overflow: 'hidden',
          borderRadius: BORDER_RADIUS_PRIMARY,
          borderWidth: 1,
          borderColor: isUncovered
            ? hexToRgba(theme.warningDecorative, UNCOVERED_BORDER_OPACITY)
            : hexToRgba(theme.primaryText, 0.08),
          backgroundColor: theme.secondaryBackground
        },
        style
      ]}
    >
      <View
        style={[
          flexbox.directionRow,
          flexbox.alignCenter,
          spacings.ph,
          spacings.pvSm,
          isUncovered && {
            backgroundColor: hexToRgba(theme.warningDecorative, UNCOVERED_BACKGROUND_OPACITY)
          }
        ]}
      >
        <PrivacyCoverShield cover={cover} youColor={youColor} />
        <View style={[flexbox.flex1, spacings.mlMd]}>
          <View style={[flexbox.directionRow, { alignItems: 'baseline' }]}>
            <Text fontSize={28} weight="number_bold" color={numberColor}>
              {cover}
            </Text>
            <Text fontSize={14} weight="semiBold" style={spacings.mlTy}>
              {cover === 1 ? t('deposit covers you') : t('deposits cover you')}
            </Text>
          </View>
          <Text fontSize={12} appearance="secondaryText">
            {t(COVER_EXPLANATIONS[stage])}
          </Text>
        </View>
        {/* In the corner, so it takes no row of its own */}
        <Text
          fontSize={10}
          weight="semiBold"
          appearance="tertiaryText"
          style={[
            text.uppercase,
            {
              position: 'absolute',
              top: SPACING_SM,
              right: SPACING,
              letterSpacing: CAPTION_LETTER_SPACING
            }
          ]}
        >
          {t('Last {{days}} days', { days: COVER_WINDOW_DAYS })}
        </Text>
      </View>

      <PrivacyCommunityNote
        style={[
          spacings.ph,
          spacings.pvSm,
          {
            borderTopWidth: 1,
            borderTopColor: hexToRgba(theme.primaryText, 0.06),
            backgroundColor: hexToRgba(theme.primaryBackground, 0.6)
          }
        ]}
      />
    </View>
  )
}

export default React.memo(PrivacyCoverCard)
