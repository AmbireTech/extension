// @ts-nocheck

import { EventEmitter } from 'events'

const tabEvent = new EventEmitter()

browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) {
    tabEvent.emit('tabUrlChanged', tabId, changeInfo.url)
  }
})

// window close will trigger this event also
browser.tabs.onRemoved.addListener((tabId) => {
  tabEvent.emit('tabRemove', tabId)
})

const createTab = async (url): Promise<number | undefined> => {
  const tab = await browser.tabs.create({
    active: true,
    url
  })

  return tab?.id
}

const openIndexPage = (route = ''): Promise<number | undefined> => {
  const url = `index.html${route && `#${route}`}`

  return createTab(url)
}

export const getCurrentTab = async (): Promise<Tabs.Tab> => {
  const tabs = await browser.tabs.query({ active: true, currentWindow: true })

  return tabs[0]
}

export default tabEvent

export { createTab, openIndexPage }
