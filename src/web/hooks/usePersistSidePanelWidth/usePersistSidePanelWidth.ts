import { useEffect } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import { getUiType } from '@common/utils/uiType'
import { browser } from '@web/constants/browserapi'
import { SIDE_PANEL_WIDTH_STORAGE_KEY } from '@web/utils/sidePanel'

const { isSidePanel } = getUiType()

const SAVE_DEBOUNCE_MS = 300

const saveSidePanelWidth = () => {
  browser.storage.local
    .set({ [SIDE_PANEL_WIDTH_STORAGE_KEY]: window.innerWidth })
    .catch((error: unknown) => {
      console.error('Failed to save the side panel width', error)
      captureException(error)
    })
}

/**
 * Chrome doesn't expose the width the user dragged the side panel to, so the panel stores its own
 * width for the request window to open at the same size.
 */
const usePersistSidePanelWidth = () => {
  useEffect(() => {
    if (!isSidePanel) return

    saveSidePanelWidth()

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(saveSidePanelWidth, SAVE_DEBOUNCE_MS)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [])
}

export default usePersistSidePanelWidth
