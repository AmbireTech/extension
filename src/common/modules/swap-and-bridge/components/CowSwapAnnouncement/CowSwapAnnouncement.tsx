import React, { memo, useCallback } from 'react'
import { View } from 'react-native'

import CowSwapIcon from '@common/assets/svg/CowSwapIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import {
  COMPACT_SETTINGS_BUTTON_SIZE,
  SETTINGS_BUTTON_SIZE
} from '@common/modules/swap-and-bridge/components/ProviderSettingsBottomSheet'
import useCowSwapAnnouncement from '@common/modules/swap-and-bridge/hooks/useCowSwapAnnouncement'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const CARET_SIZE = 10
// Floats on top of the form without pushing it down. Offset by the caret's overhang,
// so the caret isn't clipped by a parent scroll view.
const CARD_POSITION_STYLE = {
  position: 'absolute' as const,
  top: CARET_SIZE / 2 + 1,
  left: 0,
  right: 0,
  zIndex: 10
}

type Props = {
  openProviderSettingsModal: () => void
  /** Whether the settings (gear) button the card points to is the compact one. */
  isSettingsButtonCompact?: boolean
}

/**
 * Temporary, one-time card under the Swap & Bridge header that announces the
 * CoW Swap integration. It floats on top of the form (absolutely positioned) and
 * is shown on mount (not on hover like a tooltip), so it works the same on mobile
 * and web. Its caret points to the settings (gear) button.
 *
 * Render it as the first child of a parent that starts right under the header and
 * is taller than the card, because Android doesn't deliver touches to children
 * that overflow their parent.
 */
const CowSwapAnnouncement = ({
  openProviderSettingsModal,
  isSettingsButtonCompact = false
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { isCowSwapAnnouncementVisible, dismissCowSwapAnnouncement } = useCowSwapAnnouncement()

  const handleOpenSettingsPress = useCallback(() => {
    dismissCowSwapAnnouncement()
    openProviderSettingsModal()
  }, [dismissCowSwapAnnouncement, openProviderSettingsModal])

  if (!isCowSwapAnnouncementVisible) return null

  const settingsButtonSize = isSettingsButtonCompact
    ? COMPACT_SETTINGS_BUTTON_SIZE
    : SETTINGS_BUTTON_SIZE

  return (
    <View
      testID="swap-cow-swap-announcement"
      style={[
        common.borderRadiusPrimary,
        common.shadowPrimary,
        spacings.ph,
        spacings.pvSm,
        CARD_POSITION_STYLE,
        {
          backgroundColor: theme.secondaryBackground,
          borderWidth: 1,
          borderColor: theme.primaryAccent
        }
      ]}
    >
      <View
        style={{
          position: 'absolute',
          top: -CARET_SIZE / 2 - 1,
          right: settingsButtonSize / 2 - CARET_SIZE / 2,
          width: CARET_SIZE,
          height: CARET_SIZE,
          backgroundColor: theme.secondaryBackground,
          borderLeftWidth: 1,
          borderTopWidth: 1,
          borderColor: theme.primaryAccent,
          transform: [{ rotate: '45deg' }]
        }}
      />
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbMi]}>
        <CowSwapIcon width={20} height={20} />
        <Text fontSize={14} weight="semiBold" style={spacings.mlTy}>
          {t('New provider: CoW Swap')}
        </Text>
      </View>
      <Text fontSize={12} appearance="secondaryText">
        {t('Get more quotes and protection from bots.')}
      </Text>
      <View style={[flexbox.directionRow, flexbox.justifyEnd, flexbox.alignCenter, spacings.mtSm]}>
        <Button
          testID="swap-cow-swap-announcement-dismiss"
          type="ghost"
          size="small"
          text={t('Got it')}
          hasBottomSpacing={false}
          onPress={dismissCowSwapAnnouncement}
          style={spacings.mrTy}
        />
        <Button
          testID="swap-cow-swap-announcement-open-settings"
          type="primary"
          size="small"
          text={t('Open settings')}
          hasBottomSpacing={false}
          onPress={handleOpenSettingsPress}
        />
      </View>
    </View>
  )
}

export default memo(CowSwapAnnouncement)
