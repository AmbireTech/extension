import { engine } from '@web/constants/browserapi'

export const POPUP_WIDTH = 600
export const TAB_CONTENT_WIDTH = 990
export const TAB_WIDE_CONTENT_WIDTH = 1320

// The browser popup window has a top bar that takes some of the height.
// So this is about the size of this tab bar (magic number), that hopefully 🙏
// is enough to extend the height so that the content doesn't get cut.
const BROWSER_WINDOW_TOP_BAR_HEIGHT = engine === 'gecko' ? 20 : 30
export const POPUP_HEIGHT = Math.round(BROWSER_WINDOW_TOP_BAR_HEIGHT + 600)

// This are the dimensions for a collapsed request-window
// by default the request-window will be full screen and won't be with these dimensions
export const NOTIFICATION_WINDOW_WIDTH = 1100
export const NOTIFICATION_WINDOW_HEIGHT = 800
export const BROWSER_WINDOW_BAR_BUFFER = 50
export const MIN_NOTIFICATION_WINDOW_HEIGHT = 600 + BROWSER_WINDOW_BAR_BUFFER
