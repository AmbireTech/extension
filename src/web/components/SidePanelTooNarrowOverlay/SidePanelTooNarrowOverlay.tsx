import React from 'react'
import { StyleSheet, View } from 'react-native'

import SidePanelIcon from '@common/assets/svg/SidePanelIcon'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'
import { SIDE_PANEL_MIN_WIDTH } from '@web/constants/spacings'

const { isSidePanel } = getUiType()

/**
 * Covers the wallet while the side panel is narrower than SIDE_PANEL_MIN_WIDTH. Chrome never makes
 * it that narrow, but Firefox lets the sidebar be dragged narrower and offers no way to set a
 * minimum width. The wallet stays mounted underneath, so nothing the user entered is lost while
 * they resize.
 */
const SidePanelTooNarrowOverlay = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { width } = useWindowSize()

  if (!isSidePanel || width >= SIDE_PANEL_MIN_WIDTH) return null

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        flexbox.center,
        spacings.ph,
        { zIndex: 1000, backgroundColor: theme.primaryBackground }
      ]}
    >
      <SidePanelIcon width={48} height={48} color={theme.primaryText} />
      <Text fontSize={20} weight="medium" style={[spacings.mtMd, text.center]}>
        {t('Make the sidebar wider')}
      </Text>
      <Text
        fontSize={16}
        weight="regular"
        appearance="secondaryText"
        style={[spacings.mtTy, text.center]}
      >
        {t('Ambire needs a bit more room. Drag the edge of the sidebar to make it wider.')}
      </Text>
    </View>
  )
}

export default React.memo(SidePanelTooNarrowOverlay)
