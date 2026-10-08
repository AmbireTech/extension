import { useEffect } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import { getUiType } from '@common/utils/uiType'
import { browser, engine } from '@web/constants/browserapi'
import {
  FIREFOX_SIDEBAR_IS_ON_LEFT_STORAGE_KEY,
  SIDE_PANEL_WIDTH_STORAGE_KEY
} from '@web/utils/sidePanel'

const { isSidePanel } = getUiType()

const isFirefoxSidebar = isSidePanel && engine === 'gecko'

const SAVE_DEBOUNCE_MS = 300

// Moving the Firefox sidebar to the other side fires no event, so its position is checked instead
const FIREFOX_SIDEBAR_POSITION_CHECK_MS = 1000

/** Where the page's content starts on screen. Firefox-only, so undefined elsewhere. */
const getPageScreenX = () => (window as Window & { mozInnerScreenX?: number }).mozInnerScreenX

/**
 * Whether the Firefox sidebar is on the left of the browser window, measured from where its page
 * sits on screen compared to the browser window's bounds. Undefined outside Firefox or when it
 * can't be measured.
 */
const getIsFirefoxSidebarOnLeft = async (): Promise<boolean | undefined> => {
  if (!isFirefoxSidebar) return undefined

  const pageScreenX = getPageScreenX()
  if (typeof pageScreenX !== 'number') return undefined

  const browserWindow = await browser.windows.getCurrent()
  if (typeof browserWindow?.left !== 'number' || !browserWindow.width) return undefined

  const pageCenterX = pageScreenX + window.innerWidth / 2

  return pageCenterX < browserWindow.left + browserWindow.width / 2
}

const saveSidePanelLayout = async () => {
  try {
    const isFirefoxSidebarOnLeft = await getIsFirefoxSidebarOnLeft()

    await browser.storage.local.set({
      [SIDE_PANEL_WIDTH_STORAGE_KEY]: window.innerWidth,
      ...(isFirefoxSidebarOnLeft !== undefined && {
        [FIREFOX_SIDEBAR_IS_ON_LEFT_STORAGE_KEY]: isFirefoxSidebarOnLeft
      })
    })
  } catch (error) {
    console.error('Failed to save the side panel layout', error)
    captureException(error)
  }
}

/**
 * Chrome doesn't expose the width the user dragged the side panel to, so the panel stores its own
 * width for the request window to open at the same size. Firefox doesn't expose which side the
 * sidebar is on either, so there the panel stores that too, for the request window to open on the
 * same side.
 */
const usePersistSidePanelWidth = () => {
  useEffect(() => {
    if (!isSidePanel) return

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    saveSidePanelLayout()

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const scheduleSave = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(saveSidePanelLayout, SAVE_DEBOUNCE_MS)
    }

    window.addEventListener('resize', scheduleSave)

    let lastPageScreenX = getPageScreenX()
    const positionCheckIntervalId = isFirefoxSidebar
      ? setInterval(() => {
          const pageScreenX = getPageScreenX()
          if (pageScreenX === lastPageScreenX) return

          lastPageScreenX = pageScreenX
          scheduleSave()
        }, FIREFOX_SIDEBAR_POSITION_CHECK_MS)
      : undefined

    return () => {
      window.removeEventListener('resize', scheduleSave)
      clearTimeout(timeoutId)
      clearInterval(positionCheckIntervalId)
    }
  }, [])
}

export default usePersistSidePanelWidth
