//
// Content Script from bridging the messaging process between ambire-inpage/ethereum-inpage and the service_worker/background script
//
import { setupBridgeMessengerRelay } from '@web/extension-services/messengers/internal/bridge'
import { tabMessenger } from '@web/extension-services/messengers/internal/tab'
import {
  isCrossOriginFrame,
  isTooDeepFrameInTheFrameHierarchy
} from '@web/extension-services/utils/frames'

declare const globalIsAmbireNext: boolean

  // eslint-disable-next-line import/newline-after-import
;(() => {
  if (isCrossOriginFrame() || isTooDeepFrameInTheFrameHierarchy()) return

  // Run setup bridge messenger in all frames
  setupBridgeMessengerRelay()

  // Run the reactivation logic only in the top frame (skip iframes)
  if (window.top === window) {
    let lastMoveTime = 0
    const MOUSE_MOVE_THROTTLE = 1000
    let lastRestartLockTime = 0
    const RESTART_LOCK_THROTTLE = 5000

    // when the background is inactive this mechanism will reactivate it
    const registerUserActivity = () => {
      const now = Date.now()

      if (now - lastMoveTime > MOUSE_MOVE_THROTTLE) {
        lastMoveTime = now
        if (!chrome?.runtime?.id) {
          document.removeEventListener('mousemove', registerUserActivity)
          document.removeEventListener('keydown', registerUserActivity)
          return
        }

        if (now - lastRestartLockTime > RESTART_LOCK_THROTTLE) {
          lastRestartLockTime = now
          try {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            tabMessenger.send(
              globalIsAmbireNext ? 'ambireNextBuildProviderRequest' : 'ambireProviderRequest',
              { method: 'registerUserActivity' }
            )
          } catch (error) {
            console.error('Failed to send registerUserActivity to the service worker')
          }
        }

        chrome.runtime.sendMessage('mouseMoved').catch(() => {
          // Service worker might be inactive; this error is expected.
        })
      }
    }
    document.addEventListener('mousemove', registerUserActivity, { passive: true })
    document.addEventListener('keydown', registerUserActivity, { passive: true })
  }
})()
