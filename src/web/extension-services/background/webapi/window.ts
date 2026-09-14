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
/**
 * Focuses an existing window. In some cases, the passed window
 * cannot be focused (e.g., on Arc browser). If the window cannot be focused
 * within 1 second, a new window is created and the old one is removed.
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

  return new Promise<WindowProps>((resolve, reject) => {
    let isFocused = false
    let timeoutId: NodeJS.Timeout

    const cleanup = () => {
      chrome.windows.onFocusChanged.removeListener(focusListener)
      if (timeoutId) clearTimeout(timeoutId)
    }

    const focusListener = async (winId: number) => {
      if (winId === id) {
        const win = await chrome.windows.get(id).catch((e) => {
          console.error(e)
          return undefined
        })
        // In some Arc browser instances, the window never gets focused
        // therefore we need a fallback logic that will open a new window
        // and close the unfocused one
        if (win && win.focused) {
          isFocused = true
          resolve({ id, createdFromWindowId, ...updatedProps })
          cleanup()
        }
      }
    }

    chrome.windows.onFocusChanged.addListener(focusListener)

    // Attempt to focus the window
    chrome.windows
      .update(id, updatedProps)
      .then((focusedWindow) => {
        if (focusedWindow && focusedWindow.focused) {
          isFocused = true
          cleanup()
          resolve({ id, createdFromWindowId, ...updatedProps })
        }
      })
      .catch((error) => {
        cleanup()
        reject(error)
      })

    // Handle focus timeout - fallback to creating new window
    timeoutId = setTimeout(async () => {
      cleanup()

      if (!isFocused && reopenIfNeeded) {
        try {
          // Create new window and remove the old one
          const newWindow = await open()
          await chrome.windows.remove(id)
          resolve(newWindow)
        } catch (error) {
          reject(error)
        }
      }
    }, 1000)
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
