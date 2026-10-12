import React from 'react'
import { StyleSheet } from 'react-native'

import SidePanelOpenIcon from '@common/assets/svg/SidePanelOpenIcon'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import SidePanelEmptyState from '@web/components/SidePanelEmptyState'
import { SIDE_PANEL_MIN_WIDTH } from '@web/constants/spacings'
import { isFirefoxSidebar } from '@web/utils/sidePanel'

/**
 * Covers the wallet while the Firefox sidebar is narrower than SIDE_PANEL_MIN_WIDTH - Firefox lets
 * the sidebar be dragged narrower than the layout supports and offers no way to set a minimum
 * width. Chrome's side panel isn't covered: it has a minimum width of its own. The wallet stays mounted underneath, so nothing the user entered is lost while
 * they resize.
 */
const SidePanelTooNarrowOverlay = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { width } = useWindowSize()

  if (!isFirefoxSidebar || width >= SIDE_PANEL_MIN_WIDTH) return null

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
