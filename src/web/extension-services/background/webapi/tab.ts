// @ts-nocheck

import { browser, engine, isSafari } from '@web/constants/browserapi'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'

/**
 * Creates a new browser tab, optionally in a specific window.
 *
 * @param {string} url - The full URL to create the new tab with. Required.
 * @param {number} windowId - Optional ID of the browser window where the tab should be created.
 *                            It also helps to identify if there is an Ambire tab already opened in the desired window.
 *                            If the windowId prop is omitted the tab will be created in the first found window that is not of a `popup` type
 *
 * @returns {Promise<Tabs.Tab>} - The newly opened or focused browser tab.
 */
const createTab = async (url: string, windowId?: number): Promise<number | undefined> => {
  let extensionId = browser?.runtime?.id

  if (engine === 'gecko') {
    extensionId = browser.runtime.getURL('/')
  }

  if (url.startsWith('http') && !url.includes(extensionId)) {
    const tab = await browser.tabs.create({ active: true, url })
    return tab
  }
  try {
    const baseWindow = windowId
      ? await browser.windows.get(windowId, { populate: true })
      : await browser.windows.getCurrent({
          populate: true,
          windowTypes: ['normal', 'panel', 'app']
        })
    const allTabs = (baseWindow.tabs || []).filter((t) => !t.url.includes('request-window.html'))
    const base = browser.runtime.getURL('/')
    const fullUrl = new URL(url, base)
    const route = fullUrl.hash.replace(/^#/, '')
    const existingTab = allTabs.find((tab) => tab.url?.includes(extensionId))

    if (existingTab && existingTab.id) {
      const existingUrl = new URL(existingTab.url)
      const tabRoute = existingUrl.hash.replace(/^#/, '')
      const samePath = tabRoute === route

      if (samePath) {
        await browser.tabs.update(existingTab.id, { active: true })
      } else {
        await browser.tabs.update(existingTab.id, { url, active: true })
      }
      await browser.tabs.move(existingTab.id, { index: -1 })
      return existingTab.id
    }

    const tab = await browser.tabs.create({ active: true, url })
    return tab
  } catch (error) {
    console.error('Error in createTab: ', error)
  }
}

const getCurrentTab = async (): Promise<chrome.tabs.Tab | undefined> => {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    return tabs[0]
  } catch (error) {
    return undefined
  }
}

/**
 * Opens a URL in a new browser tab, optionally in a specific window.
 *
 * @param {string} url - The full URL to open in a new tab. Required.
 * @param {number} windowId - Optional ID of the browser window where the tab should be opened.
 *                            Helps ensure the tab opens in the intended window (especially useful in multi-window
 *                            scenarios e.g. opening a new tab from an request-window).
 * @param {boolean} shouldCloseCurrentWindow - If true, closes the current window after opening the new tab.
 *                                             Has no effect in Safari due to API limitations.
 *
 * @returns {Promise<Tabs.Tab>} - The newly opened or focused browser tab.
 */
export const openInTab = async ({
  url,
  windowId,
  shouldCloseCurrentWindow
}: {
  url: string
  windowId?: number
  shouldCloseCurrentWindow?: boolean
}): Promise<chrome.tabs.Tab> => {
  if (!url) return

  const tab = await createTab(url, windowId)
  if (shouldCloseCurrentWindow) {
    if (!isSafari()) await closeCurrentWindow()
  }

  return tab
}

const routeableSearchParams = ['flow', 'goBack']

/**
 * Opens an internal route in a new tab, similar to react-router's `navigate` function.
 *
 * @param {string} route - The internal route to navigate to (e.g., WEB_ROUTES.someRouteName).
 * @param {object} searchParams - Optional URL search parameters (e.g., { flow: 'onboarding' }).
 *                                Only parameters listed in `routeableSearchParams` will be included.
 * @param {number} windowId - Optional ID of the browser window where the tab should open.
 *                            Recommended when the current context is an action window—
 *                            use `createdFromWindowId` from actions controller to ensure
 *                            the tab opens in the correct window (avoids opening in the action window itself or searching
 *                            for existing Ambire tabs in the wrong window).
 * @param {boolean} shouldCloseCurrentWindow - If true, closes the current window after opening the new tab.
 *
 * @returns {void}
 */
const openInternalPageInTab = async ({
  route,
  searchParams = {},
  windowId,
  shouldCloseCurrentWindow
}: {
  route: string
  searchParams?: any
  windowId?: number
  shouldCloseCurrentWindow?: boolean
}) => {
  const searchToParams = searchParams
    ? `${Object.keys(searchParams)
        .map((key) =>
          routeableSearchParams.indexOf(key) !== -1 ? `${key}=${searchParams[key]}` : ''
        )
        .filter((value: string) => value)
        .join('&')}`
    : ''

  await openInTab({
    url: `./tab.html${
      route ? `#/${route}${searchToParams !== '' ? `?${searchToParams}` : ''}` : ''
    }`,
    windowId,
    shouldCloseCurrentWindow
  })
}

export { createTab, getCurrentTab, openInternalPageInTab }
