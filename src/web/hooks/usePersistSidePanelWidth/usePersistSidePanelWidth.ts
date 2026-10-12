import { useEffect } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics.web'
import { getUiType } from '@common/utils/uiType'
import { browser } from '@web/constants/browserapi'
import { SIDE_PANEL_MIN_WIDTH } from '@web/constants/spacings'
import {
  FIREFOX_SIDEBAR_IS_ON_LEFT_STORAGE_KEY,
  isFirefoxSidebar,
  SIDE_PANEL_WIDTH_STORAGE_KEY
} from '@web/utils/sidePanel'

const { isSidePanel } = getUiType()

const SAVE_DEBOUNCE_MS = 300

// Moving the Firefox sidebar to the other side fires no event, and the side can't be measured later
// (the sidebar is closed when a request window opens), so its position is checked while it's open.
// The check only reads two numbers and saves nothing unless the sidebar moved within the window.
const FIREFOX_SIDEBAR_POSITION_CHECK_MS = 1000

/** Where the page's content starts on screen. Firefox-only, so undefined elsewhere. */
const getPageScreenX = () => (window as Window & { mozInnerScreenX?: number }).mozInnerScreenX

/**
 * How far the page's content starts from the browser window's left edge. Unlike the position on
 * screen, it doesn't change when the whole browser window is moved - only when the sidebar is.
 */
const getPageOffsetInBrowserWindow = () => {
  const pageScreenX = getPageScreenX()

  return typeof pageScreenX === 'number' ? pageScreenX - window.screenX : undefined
}

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
    // A Firefox sidebar can be dragged narrower than the layout supports - such a width isn't saved,
    // so the request window keeps opening at the last width it renders correctly at
    const isWidthSupported = !isFirefoxSidebar || window.innerWidth >= SIDE_PANEL_MIN_WIDTH

    await browser.storage.local.set({
      ...(isWidthSupported && { [SIDE_PANEL_WIDTH_STORAGE_KEY]: window.innerWidth }),
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

    let lastPageOffset = getPageOffsetInBrowserWindow()
    const positionCheckIntervalId = isFirefoxSidebar
      ? setInterval(() => {
          const pageOffset = getPageOffsetInBrowserWindow()
          if (pageOffset === lastPageOffset) return

          lastPageOffset = pageOffset
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
