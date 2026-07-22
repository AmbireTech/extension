import { getChromeSidePanelApi } from '@web/utils/sidePanel'
import { captureBackgroundException } from '@web/extension-services/background/CrashAnalytics'

const POPUP_PATH = 'index.html'

export const applySidePanelMode = async (enabled: boolean) => {
  const sidePanelApi = getChromeSidePanelApi()
  if (!sidePanelApi) return

  try {
    await sidePanelApi.setPanelBehavior({ openPanelOnActionClick: enabled })
    await chrome.action.setPopup({ popup: enabled ? '' : POPUP_PATH })
  } catch (error) {
    console.error('Failed to apply side panel mode', error)
    captureBackgroundException(error)
  }
}

export const openSidePanel = async (windowId?: number) => {
  const sidePanelApi = getChromeSidePanelApi()
  if (!sidePanelApi) return

  try {
    let resolvedWindowId = windowId

    if (!resolvedWindowId) {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
      resolvedWindowId = activeTab?.windowId
    }

    if (!resolvedWindowId) return

    await sidePanelApi.open({ windowId: resolvedWindowId })
  } catch (error) {
    console.error('Failed to open side panel', error)
    captureBackgroundException(error)
  }
}
