import { EventEmitter } from 'events'

import { WindowProps } from '@ambire-common/interfaces/window'
import { SPACING } from '@common/styles/spacings'
import { browser, engine, isExtension, isSafari } from '@web/constants/browserapi'
import { IS_WINDOWS } from '@web/constants/common'
import {
  MIN_NOTIFICATION_WINDOW_HEIGHT,
  NOTIFICATION_WINDOW_HEIGHT,
  NOTIFICATION_WINDOW_WIDTH,
  TAB_WIDE_CONTENT_WIDTH
} from '@web/constants/spacings'

type CustomSize = {
  width: number
  height: number
}

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

const getScreenHeight = (h: number) => {
  try {
    const height = h > MIN_NOTIFICATION_WINDOW_HEIGHT ? h : MIN_NOTIFICATION_WINDOW_HEIGHT

    return Math.round(height)
  } catch (error) {
    return Math.round(MIN_NOTIFICATION_WINDOW_HEIGHT)
  }
}

const getScreenWidth = (w: number) => {
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

// creates a browser new window that is 15% smaller
// of the current page and is centered in the browser app
const createFullScreenWindow = async (
  url: string,
  customSize?: CustomSize
): Promise<WindowProps> => {
  let screenWidth = 0
  let screenHeight = 0

  if (isSafari()) {
    screenWidth = getScreenWidth(NOTIFICATION_WINDOW_WIDTH)
    screenHeight = getScreenHeight(NOTIFICATION_WINDOW_HEIGHT)
  } else if (engine === 'webkit') {
    const displayInfo = await chrome.system.display.getInfo()
    screenWidth = getScreenWidth(displayInfo?.[0]?.workArea?.width)
    screenHeight = getScreenHeight(displayInfo?.[0]?.workArea?.height)
  } else {
    screenWidth = getScreenWidth(window.screen.width)
    screenHeight = getScreenHeight(window.screen.height)
  }

  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (activeTabs) => {
      const ratio = 0.88 // 88% of the screen/tab size

      let desiredWidth = getScreenWidth(screenWidth * ratio)
      let desiredHeight = getScreenHeight(screenHeight * ratio)

      if (customSize) {
        desiredHeight = customSize.height
        desiredWidth = customSize.width
      }

      let leftPosition = (screenWidth - desiredWidth) / 2
      let topPosition = (screenHeight - desiredHeight) / 2

      const activeTab = activeTabs[0]
      if (!chrome.runtime.lastError && activeTab) {
        chrome.windows.getCurrent(
          { populate: true, windowTypes: ['normal', 'panel', 'app'] },
          (currentWindow: any) => {
            let leftOffset = 0
            let topOffset = 0
            if (currentWindow) {
              leftOffset = currentWindow.left
              topOffset = currentWindow.top
            }

            if (activeTab.width && activeTab.height) {
              desiredWidth = getScreenWidth(activeTab.width * ratio)
              if (customSize) desiredWidth = customSize.width
              leftPosition = (activeTab.width - desiredWidth) / 2 + leftOffset
              // Pass customSize height to the helper as the height may be lower than the minimum height
              desiredHeight = getScreenHeight(customSize?.height || activeTab.height * ratio)
              topPosition =
                (activeTab.height - desiredHeight) / 2 +
                topOffset +
                currentWindow.height -
                activeTab.height
            }

            chrome.windows.create(
              {
                focused: true,
                url,
                type: 'popup',
                width: desiredWidth,
                height: desiredHeight,
                left: leftPosition <= SPACING ? Math.round(SPACING) : Math.round(leftPosition),
                top: topPosition <= SPACING ? Math.round(SPACING) : Math.round(topPosition),
                state: 'normal'
              },
              (win) => {
                resolve(
                  win?.id
                    ? {
                        id: win.id,
                        width: desiredWidth,
                        height: desiredHeight,
                        left:
                          leftPosition <= SPACING ? Math.round(SPACING) : Math.round(leftPosition),
                        top: topPosition <= SPACING ? Math.round(SPACING) : Math.round(topPosition),
                        focused: true
                      }
                    : null
                )
              }
            )
          }
        )
      }
    })
  })
}

const create = async (url: string, customSize?: CustomSize): Promise<WindowProps> => {
  const windowProps = await createFullScreenWindow(url, customSize)
  return windowProps
}

const remove = async (winId: number) => {
  await chrome.windows.remove(winId)
}

const open = async (
  options: { route?: string; customSize?: CustomSize } = {}
): Promise<WindowProps> => {
  const { route, customSize } = options

  const url = `action-window.html${route ? `#/${route}` : ''}`
  return create(url, customSize)
}

const focus = async (windowProps: WindowProps) => {
  if (windowProps) {
    const { id, top, left, width, height } = windowProps
    await chrome.windows.update(id, { focused: true, top, left, width, height })
  }
}

const closeCurrentWindow = async () => {
  if (isSafari()) {
    try {
      const win: any = await chrome.windows.getCurrent()
      await chrome.windows.remove(win.id)
    } catch (error) {
      // silent fail
    }
  } else {
    window.close()
  }
}

export default {
  open,
  focus,
  remove,
  event
}

export { closeCurrentWindow }
