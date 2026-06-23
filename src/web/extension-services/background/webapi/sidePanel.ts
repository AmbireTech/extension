import { getChromeSidePanelApi } from '@web/utils/sidePanel'

const POPUP_PATH = 'index.html'

export const applySidePanelMode = async (enabled: boolean) => {
  const sidePanelApi = getChromeSidePanelApi()
  if (!sidePanelApi) return

  try {
    await sidePanelApi.setPanelBehavior({ openPanelOnActionClick: enabled })
    await chrome.action.setPopup({ popup: enabled ? '' : POPUP_PATH })
  } catch (error) {
    console.error('Failed to apply side panel mode', error)
  }
}

export const openSidePanel = async () => {
  const sidePanelApi = getChromeSidePanelApi()
  if (!sidePanelApi) return

  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!activeTab?.windowId) return

    await sidePanelApi.open({ windowId: activeTab.windowId })
  } catch (error) {
    console.error('Failed to open side panel', error)
  }
}
