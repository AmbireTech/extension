import { browserAPI } from '../constants/browserAPI.js'
import { VERBOSE } from '../constants/env.js'

// update the extension icon depending on the state
export const updateExtensionIcon = async (
  tabId,
  TAB_INJECTIONS,
  PERMISSIONS,
  PENDING_PERMISSIONS_CALLBACKS
) => {
  if (!parseInt(tabId)) return

  tabId = parseInt(tabId)

  browserAPI.tabs.get(tabId, async (tab) => {
    if (tab) {
      let iconUrl
      const tabHost = new URL(tab.url).host

      if (!tab.url.startsWith('http')) {
        iconUrl = browserAPI.runtime.getURL('../assets/images/xicon.png')
      } else if (TAB_INJECTIONS[tabId]) {
        if (PERMISSIONS[tabHost] === true) {
          // TODO: xicon_connected
          iconUrl = browserAPI.runtime.getURL('../assets/images/xicon.png')
        } else if (PERMISSIONS[tabHost] === false) {
          iconUrl = browserAPI.runtime.getURL('../assets/images/xicon_denied.png')
        } else if (PENDING_PERMISSIONS_CALLBACKS[tabHost]) {
          iconUrl = browserAPI.runtime.getURL('../assets/images/xicon_pending.png')
        } else {
          iconUrl = browserAPI.runtime.getURL('../assets/images/xicon.png')
        }
      } else {
        // TODO: xicon_connected
        iconUrl = browserAPI.runtime.getURL('../assets/images/xicon.png')
      }

      if (VERBOSE) console.log(`setting icon for tab ${tabId} ${iconUrl}`)
      browserAPI.action.setIcon(
        {
          tabId,
          path: iconUrl
        },
        () => true
      )
    } else {
      console.warn(`No tabs found for id ${tabId}`)
    }
  })
}
