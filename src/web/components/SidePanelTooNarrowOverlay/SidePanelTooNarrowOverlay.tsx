import React from 'react'
import { StyleSheet } from 'react-native'

import SidePanelOpenIcon from '@common/assets/svg/SidePanelOpenIcon'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { getUiType } from '@common/utils/uiType'
import SidePanelEmptyState from '@web/components/SidePanelEmptyState'
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
    <SidePanelEmptyState
      style={[StyleSheet.absoluteFill, { zIndex: 1000, backgroundColor: theme.primaryBackground }]}
      icon={<SidePanelOpenIcon width={48} height={48} color={theme.primaryText} />}
      title={t('Make the sidebar wider')}
      description={t(
        'Ambire needs a bit more room. Drag the edge of the sidebar to make it wider.'
      )}
    />
  )
}

export default React.memo(SidePanelTooNarrowOverlay)
