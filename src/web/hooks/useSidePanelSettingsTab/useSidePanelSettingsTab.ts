import { useCallback, useSyncExternalStore } from 'react'

import { getUiType } from '@common/utils/uiType'
import { browser } from '@web/constants/browserapi'

const { isSidePanel } = getUiType()

const isAmbireSettingsTabUrl = (url?: string) =>
  !!url && url.includes('tab.html') && url.includes('/settings')

type SidePanelSettingsTabState = {
  settingsTabId: number | undefined
  windowId: number | undefined
}

const emptyState: SidePanelSettingsTabState = {
  settingsTabId: undefined,
  windowId: undefined
}

let cachedState: SidePanelSettingsTabState = emptyState
const listeners = new Set<() => void>()
let browserTabsListenersAttached = false

const emitChange = () => {
  listeners.forEach((listener) => listener())
}

const getSidePanelWindowId = async (): Promise<number | undefined> => {
  if (browser?.windows?.getCurrent) {
    try {
      const currentWindow = await browser.windows.getCurrent()
      if (typeof currentWindow?.id === 'number') return currentWindow.id
    } catch {
      // Side panel may not resolve a window via getCurrent in some browsers.
    }
  }

  if (browser?.tabs?.query) {
    try {
      const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (typeof activeTab?.windowId === 'number') return activeTab.windowId
    } catch {
      // Fall through to tabs.getCurrent.
    }
  }

  if (browser?.tabs?.getCurrent) {
    try {
      const currentTab = await browser.tabs.getCurrent()
      if (typeof currentTab?.windowId === 'number') return currentTab.windowId
    } catch {
      // No tab context available.
    }
  }

  return undefined
}

const refreshSettingsTab = async () => {
  if (!isSidePanel || !browser?.tabs?.query) return

  try {
    const resolvedWindowId = await getSidePanelWindowId()

    if (!resolvedWindowId) {
      if (cachedState.settingsTabId !== undefined || cachedState.windowId !== undefined) {
        cachedState = emptyState
        emitChange()
      }
      return
    }

    const tabs = await browser.tabs.query({ windowId: resolvedWindowId })
    const settingsTab = tabs.find((tab: chrome.tabs.Tab) => isAmbireSettingsTabUrl(tab.url))
    const nextSettingsTabId = settingsTab?.id

    if (cachedState.windowId !== resolvedWindowId || cachedState.settingsTabId !== nextSettingsTabId) {
      cachedState = { windowId: resolvedWindowId, settingsTabId: nextSettingsTabId }
      emitChange()
    }
  } catch {
    if (cachedState.settingsTabId !== undefined || cachedState.windowId !== undefined) {
      cachedState = emptyState
      emitChange()
    }
  }
}

const onTabUpdated = (
  _tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab
) => {
  if (changeInfo.url || changeInfo.status === 'complete' || isAmbireSettingsTabUrl(tab.url)) {
    void refreshSettingsTab()
  }
}

const onTabRemoved = () => {
  void refreshSettingsTab()
}

const attachBrowserTabListeners = () => {
  if (browserTabsListenersAttached || !browser?.tabs) return

  browserTabsListenersAttached = true
  browser.tabs.onUpdated.addListener(onTabUpdated)
  browser.tabs.onRemoved.addListener(onTabRemoved)
  void refreshSettingsTab()
}

const detachBrowserTabListeners = () => {
  if (!browserTabsListenersAttached || !browser?.tabs) return

  browserTabsListenersAttached = false
  browser.tabs.onUpdated.removeListener(onTabUpdated)
  browser.tabs.onRemoved.removeListener(onTabRemoved)
}

const subscribe = (onStoreChange: () => void) => {
  if (!isSidePanel) return () => {}

  listeners.add(onStoreChange)

  if (listeners.size === 1) {
    attachBrowserTabListeners()
  }

  return () => {
    listeners.delete(onStoreChange)

    if (listeners.size === 0) {
      detachBrowserTabListeners()
    }
  }
}

const getSnapshot = () => cachedState

const getServerSnapshot = () => emptyState

const useSidePanelSettingsTab = () => {
  const { settingsTabId, windowId } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  )

  const closeSettingsTab = useCallback(async () => {
    if (!settingsTabId || !browser?.tabs?.remove) return

    try {
      await browser.tabs.remove(settingsTabId)
    } catch (error) {
      console.error('Failed to close settings tab', error)
    }
  }, [settingsTabId])

  return {
    isSettingsTabOpen: typeof settingsTabId === 'number',
    closeSettingsTab,
    windowId
  }
}

export default useSidePanelSettingsTab
