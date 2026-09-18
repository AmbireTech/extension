import { EventEmitter } from 'events'

import { FocusWindowParams, WindowProps } from '@ambire-common/interfaces/ui'
import { SPACING } from '@common/styles/spacings'
import { browser, engine, isExtension, isSafari } from '@web/constants/browserapi'
import { IS_FIREFOX, IS_WINDOWS } from '@web/constants/common'
import {
  MIN_NOTIFICATION_WINDOW_HEIGHT,
  NOTIFICATION_WINDOW_HEIGHT,
  NOTIFICATION_WINDOW_WIDTH,
  TAB_WIDE_CONTENT_WIDTH
} from '@web/constants/spacings'
import { PortMessenger } from '@web/extension-services/messengers'
import { isExtensionOverlayPort } from '@web/utils/sidePanel'

type CustomSize = {
  width: number
  height: number
}

/**
 * The usable area of a single display, positioned in the desktop coordinate space. A display
 * doesn't necessarily start at (0, 0), so `left` and `top` are what make the position usable.
 */
type WorkArea = {
  left: number
  top: number
  width: number
  height: number
}

/**
 * The screen of a browser that reports where its display sits on the desktop. Firefox has no
 * `system.display` API and exposes the offset through these non-standard properties instead.
 */
type ScreenWithOffset = Screen & { availLeft?: number; availTop?: number }

const event = new EventEmitter()

if (isExtension) {
  // if focus other windows, then reject the notification request
  browser.windows.onFocusChanged.addListener((winId: any) => {
    event.emit('windowFocusChange', winId)
  })

  browser.windows.onRemoved.addListener((winId: any) => {
    event.emit('windowRemoved', winId)
  })
}

export const WINDOW_SIZE = {
  width: NOTIFICATION_WINDOW_WIDTH + (IS_WINDOWS ? 14 : 0), // idk why windows cut the width.
  height: NOTIFICATION_WINDOW_HEIGHT
}

const formatScreenHeight = (h: number) => {
  try {
    const height = h > MIN_NOTIFICATION_WINDOW_HEIGHT ? h : MIN_NOTIFICATION_WINDOW_HEIGHT

    return Math.round(height)
  } catch (error) {
    return Math.round(MIN_NOTIFICATION_WINDOW_HEIGHT)
  }
}

const formatScreenWidth = (w: number) => {
  try {
    if (w < NOTIFICATION_WINDOW_WIDTH) {
      return Math.round(NOTIFICATION_WINDOW_WIDTH)
    }
    if (w > TAB_WIDE_CONTENT_WIDTH) {
      return Math.round(TAB_WIDE_CONTENT_WIDTH)
    }

    return Math.round(w)
  } catch (error) {
    return Math.round(NOTIFICATION_WINDOW_WIDTH)
  }
}

const isPointInWorkArea = (workArea: WorkArea, x: number, y: number) =>
  x >= workArea.left &&
  x <= workArea.left + workArea.width &&
  y >= workArea.top &&
  y <= workArea.top + workArea.height

/**
 * Finds the work area of the display holding the given window, falling back to the primary display
 * when the window can't be located. Returns null when the browser hides the layout, as in Safari.
 */
const getDisplayWorkArea = async (baseWindow: chrome.windows.Window): Promise<WorkArea | null> => {
  if (isSafari()) return null

  if (engine === 'webkit' && browser?.system?.display?.getInfo) {
    const displays: chrome.system.display.DisplayInfo[] = await browser.system.display.getInfo()

    if (!displays?.length) return null

    const canLocateBaseWindow =
      baseWindow.left !== undefined &&
      baseWindow.top !== undefined &&
      !!baseWindow.width &&
      !!baseWindow.height

    // Wayland never reports the global position of a window, so the base window appears to be at
    // (0, 0) there and the primary display is used instead
    const displayWithBaseWindow = canLocateBaseWindow
      ? displays.find((display) =>
          isPointInWorkArea(
            display.workArea,
            baseWindow.left! + baseWindow.width! / 2,
            baseWindow.top! + baseWindow.height! / 2
          )
        )
      : undefined

    const display = displayWithBaseWindow || displays.find((d) => d.isPrimary) || displays[0]

    return display?.workArea || null
  }

  const screen: ScreenWithOffset | undefined = window?.screen

  if (!screen) return null

  return {
    left: screen.availLeft || 0,
    top: screen.availTop || 0,
    width: screen.availWidth || screen.width,
    height: screen.availHeight || screen.height
  }
}

const clampToWorkArea = (
  position: number,
  windowSize: number,
  workAreaStart: number,
  workAreaSize: number
) => {
  const min = workAreaStart + SPACING
  const max = workAreaStart + workAreaSize - windowSize - SPACING

  // The window doesn't fit, so align it to the start of the work area
  if (max < min) return Math.round(min)

  return Math.round(Math.min(Math.max(position, min), max))
}

const calculateWindowSizeAndPosition = async (
  baseWindow: chrome.windows.Window,
  customSize?: CustomSize
): Promise<{ width: number; height: number; left: number; top: number }> => {
  // In CI (headless: true), the calculated window position is always outside the visible screen, causing window.open() to fail with:
  // "Invalid value for bounds. Bounds must be at least 50% within visible screen space".
  // To fix this, we return hardcoded position values to ensure it works.
  if (process.env.IS_TESTING === 'true') {
    return {
      width: 1100,
      height: 800,
      left: 0,
      top: 0
    }
  }

  const workArea = await getDisplayWorkArea(baseWindow)

  let screenWidth = 0
  let screenHeight = 0

  if (isSafari()) {
    screenWidth = formatScreenWidth(NOTIFICATION_WINDOW_WIDTH)
    screenHeight = formatScreenHeight(NOTIFICATION_WINDOW_HEIGHT)
  } else if (engine === 'webkit' && workArea) {
    screenWidth = formatScreenWidth(workArea.width)
    screenHeight = formatScreenHeight(workArea.height)
  } else {
    screenWidth = formatScreenWidth(window.screen.width)
    screenHeight = formatScreenHeight(window.screen.height)
  }

  const ratio = 0.9 // 90% of the screen/tab size

  // By default the desired window dimensions should be 720x800
  // or if the screen height is smaller 800 make the window height 90% of the screen height
  let desiredWidth = 720
  let desiredHeight = Math.min(800, screenHeight * ratio)

  if (customSize) {
    desiredWidth = customSize.width
    desiredHeight = Math.min(customSize.height, screenHeight * ratio)
  }

  let leftPosition = (screenWidth - desiredWidth) / 2
  let topPosition = (screenHeight - desiredHeight) / 2

  const [activeTab] = (baseWindow.tabs || []).find((t) => t.active)
    ? [(baseWindow.tabs || []).find((t) => t.active)]
    : await chrome.tabs.query({ active: true, windowId: baseWindow.id })

  let leftOffset = 0
  let topOffset = 0

  if (baseWindow && baseWindow.left !== undefined && baseWindow.top !== undefined) {
    leftOffset = baseWindow.left
    topOffset = baseWindow.top
  }

  if (activeTab && activeTab.width && activeTab.height) {
    if (customSize) desiredWidth = customSize.width
    leftPosition = (activeTab.width - desiredWidth) / 2 + leftOffset
    // Pass customSize height to the helper as the height may be lower than the minimum height
    desiredHeight = formatScreenHeight(
      customSize?.height
        ? Math.min(customSize.height, activeTab.height * ratio)
        : Math.min(desiredHeight, activeTab.height * ratio)
    )
    topPosition =
      (activeTab.height - desiredHeight) / 2 + topOffset + baseWindow.height! - activeTab.height
  }

  // The browser rejects bounds that are mostly outside the visible screen space. Without a known
  // display layout the position can only be kept away from the top left corner.
  return {
    width: desiredWidth,
    height: desiredHeight,
    left: workArea
      ? clampToWorkArea(leftPosition, desiredWidth, workArea.left, workArea.width)
      : Math.round(Math.max(leftPosition, SPACING)),
    top: workArea
      ? clampToWorkArea(topPosition, desiredHeight, workArea.top, workArea.height)
      : Math.round(Math.max(topPosition, SPACING))
  }
}

const create = async (
  url: string,
  customSize?: CustomSize,
  baseWindowId?: number
): Promise<WindowProps> => {
  let baseWindow: chrome.windows.Window | undefined

  if (baseWindowId) {
    const window = await chrome.windows.get(baseWindowId, { populate: true }).catch((e) => {
      console.error(e)
      return undefined
    })
    if (window && window.id) baseWindow = window
  }

  if (!baseWindow || !baseWindow.id) {
    console.warn(
      baseWindowId
        ? `No baseWindow with id: ${baseWindowId} was found in windowManager.open(); using the current window as the reference for positioning.`
        : 'No baseWindowId provided to windowManager.open(); using the current window as the reference for positioning.'
    )

    baseWindow = await chrome.windows.getCurrent({
      windowTypes: ['normal', 'panel', 'app'],
      populate: true
    })
  }

  const { width, height, left, top } = await calculateWindowSizeAndPosition(baseWindow, customSize)

  const win = await chrome.windows.create({
    focused: true,
    url,
    type: 'popup',
    width,
    height,
    left,
    top,
    state: 'normal'
  })

  if (!win || !win.id) return null

  return {
    id: win.id,
    width,
    height,
    left,
    top,
    focused: true,
    createdFromWindowId: baseWindow.id
  }
}

const remove = async (winId: number, pm: PortMessenger) => {
  // In Firefox, closing a browser window (e.g., the request window) can also close the extension popup in the main window.
  // As a workaround, we first unfocus the window, then change the route. On the next chrome.windows.create call,
  // if a blank window exists, we close it before opening a new one. This prevents stacking multiple blank windows in the background.
  if (IS_FIREFOX) {
    const windows = await chrome.windows.getAll({ populate: true })
    const windowToRemove = windows.find((w) => w.id === winId)

    if (
      windowToRemove &&
      windowToRemove.type === 'popup' && // if a request window is opened
      pm.ports.some((p) => isExtensionOverlayPort(p.name)) // if the extension popup or side panel is opened
    ) {
      chrome.windows
        .update(winId, { focused: false, top: 0, left: 0, width: 0, height: 0 })
        .catch((e) => console.error(e))
      const firstTab = windowToRemove.tabs?.[0]
      if (firstTab?.id)
        await chrome.tabs.update(firstTab.id, { url: 'about:blank' }).catch((e) => console.error(e))
      event.emit('windowRemoved', winId)

      return
    }
  }

  await chrome.windows.remove(winId).catch((e) => console.error(e))
}

const open = async (
  options: { route?: string; customSize?: CustomSize; baseWindowId?: number } = {}
): Promise<WindowProps> => {
  const { route, customSize, baseWindowId } = options

  const url = `request-window.html${route ? `#/${route}` : ''}`
  return create(url, customSize, baseWindowId)
}
/** How long a window gets to report itself focused before it is treated as unfocusable. */
const FOCUS_CONFIRMATION_TIMEOUT = 1000

/**
 * Focuses an existing window and repositions it over the window it was opened from. Some windows
 * can never be focused (Arc does this) - one that still isn't focused after a second is replaced
 * by a fresh one, unless the caller asked for the window to be left alone.
 *
 * Resolves with the props of whichever window the caller ends up with.
 */
const focus = async (
  windowProps: WindowProps,
  params?: FocusWindowParams
): Promise<WindowProps> => {
  if (!windowProps) throw new Error('windowProps is undefined')

  const { id, width, height, createdFromWindowId } = windowProps
  const { reopenIfNeeded = true } = params || {}

  let baseWindow: chrome.windows.Window | undefined

  if (createdFromWindowId) {
    baseWindow = await chrome.windows.get(createdFromWindowId, { populate: true }).catch((e) => {
      console.error(e)
      return undefined
    })
  }

  if (!baseWindow || !baseWindow.id) {
    baseWindow = await chrome.windows.getCurrent({ populate: true })
  }

  const { left, top } = await calculateWindowSizeAndPosition(baseWindow, { width, height })

  const updatedProps = { width, height, left, top, focused: true }

  /**
   * Whether the browser reports the window as focused right now. Asked rather than inferred:
   * a window that was already focused when we got here never fires a focus event, and one that
   * was just created can still be reported as unfocused by the call that focuses it. Neither
   * silence is evidence that focusing failed.
   */
  const isWindowFocused = async () => {
    const win = await chrome.windows.get(id).catch((e) => {
      console.error(e)
      return undefined
    })

    return !!win?.focused
  }

  return new Promise<WindowProps>((resolve, reject) => {
    let isSettled = false
    let timeoutId: NodeJS.Timeout

    const cleanup = () => {
      chrome.windows.onFocusChanged.removeListener(focusListener)
      if (timeoutId) clearTimeout(timeoutId)
    }

    const settleWith = (props: WindowProps) => {
      if (isSettled) return

      isSettled = true
      cleanup()
      resolve(props)
    }

    const settle = () => settleWith({ id, createdFromWindowId, ...updatedProps })

    const fail = (error: any) => {
      if (isSettled) return

      isSettled = true
      cleanup()
      reject(error)
    }

    const focusListener = async (winId: number) => {
      if (winId !== id || isSettled) return

      if (await isWindowFocused()) settle()
    }

    chrome.windows.onFocusChanged.addListener(focusListener)

    chrome.windows
      .update(id, updatedProps)
      .then(async (focusedWindow) => {
        if (isSettled) return

        if (focusedWindow?.focused || (await isWindowFocused())) settle()
      })
      .catch(fail)

    timeoutId = setTimeout(async () => {
      if (isSettled) return

      // Last word before the window is replaced. Removing one the user is looking at is far
      // worse than leaving an unfocused one up, so it only happens once the browser has
      // confirmed the window really is not focused.
      if (await isWindowFocused()) {
        settle()
        return
      }

      // Nothing left to try and the caller would rather keep an unfocused window than lose it
      // (closing the request window mid-signing aborts the signing)
      if (!reopenIfNeeded) {
        settle()
        return
      }

      try {
        const newWindow = await open()
        await chrome.windows.remove(id)
        settleWith(newWindow)
      } catch (error) {
        fail(error)
      }
    }, FOCUS_CONFIRMATION_TIMEOUT)
  })
}

const closeCurrentWindow = async () => {
  const windowObj: Window | undefined = window

  if (isSafari() || !windowObj) {
    try {
      const win = await chrome.windows.getCurrent()
      await chrome.windows.remove(win.id!)
    } catch (e) {
      console.error(e)
    }
  } else {
    windowObj.close()
  }
}

const closePopupWithUrl = async (url: string) => {
  const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['popup'] })

  const matchingWindowId = windows.find((w) => {
    return w.tabs?.some((t) => t.url?.includes(url))
  })?.id

  if (!matchingWindowId) {
    throw new Error(`No matching window found for URL: ${url}`)
  }

  await chrome.windows.remove(matchingWindowId)
}

const getCurrentWindow = async () => {
  return chrome.windows.getCurrent()
}

export default { open, focus, closePopupWithUrl, remove, event }

export { closeCurrentWindow, getCurrentWindow }
