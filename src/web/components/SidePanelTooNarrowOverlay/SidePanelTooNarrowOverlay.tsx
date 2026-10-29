import React, { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'

import SidePanelOpenIcon from '@common/assets/svg/SidePanelOpenIcon'
import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import { getUiType } from '@common/utils/uiType'
import SidePanelEmptyState from '@web/components/SidePanelEmptyState'
import { SIDE_PANEL_MIN_WIDTH } from '@web/constants/spacings'
import { getIsFirefoxSidebarOnLeft } from '@web/utils/sidePanel'

const { isFirefoxSidebar } = getUiType()

// The icon's arrow points left - outwards for a sidebar on the right. A sidebar on the left widens
// to the right, so there the icon is turned around.
const ICON_TURNED_AROUND_STYLE = { transform: [{ rotate: '180deg' }] }

/**
 * Covers the wallet while the Firefox sidebar is narrower than SIDE_PANEL_MIN_WIDTH - Firefox lets
 * the sidebar be dragged narrower than the layout supports and offers no way to set a minimum
 * width. Chrome's side panel isn't covered: it has a minimum width of its own. The wallet stays
 * mounted underneath, so nothing the user entered is lost while they resize.
 */
const SidePanelTooNarrowOverlay = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { width } = useWindowSize()
  // Firefox opens the sidebar on the left by default, so that's assumed until it's measured
  const [isSidebarOnLeft, setIsSidebarOnLeft] = useState(true)

  const isTooNarrow = isFirefoxSidebar && width < SIDE_PANEL_MIN_WIDTH

  useEffect(() => {
    if (!isTooNarrow) return

    let isMounted = true

    getIsFirefoxSidebarOnLeft()
      .then((isOnLeft) => {
        if (isMounted && isOnLeft !== undefined) setIsSidebarOnLeft(isOnLeft)
      })
      .catch((error: unknown) => {
        console.error('Failed to read which side the Firefox sidebar is on', error)
        captureException(error)
      })

    return () => {
      isMounted = false
    }
  }, [isTooNarrow])

  if (!isTooNarrow) return null

  return (
    <SidePanelEmptyState
      style={[StyleSheet.absoluteFill, { zIndex: 1000, backgroundColor: theme.primaryBackground }]}
      icon={
        <SidePanelOpenIcon
          width={48}
          height={48}
          color={theme.primaryText}
          style={isSidebarOnLeft ? ICON_TURNED_AROUND_STYLE : undefined}
        />
      }
      title={t('Make the sidebar wider')}
      description={t(
        'Ambire needs a bit more room. Drag the edge of the sidebar to make it wider.'
      )}
    />
  )
}

export default React.memo(SidePanelTooNarrowOverlay)
