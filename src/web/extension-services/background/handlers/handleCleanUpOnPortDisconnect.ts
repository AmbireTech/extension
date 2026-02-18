import { MainController } from '@ambire-common/controllers/main/main'
import { ONBOARDING_WEB_ROUTES } from '@common/modules/router/constants/common'
import { IS_FIREFOX } from '@web/constants/common'
import { Port } from '@web/extension-services/messengers'

export const handleCleanUpOnPortDisconnect = async ({
  port,
  mainCtrl
}: {
  port: Port
  mainCtrl: MainController
}) => {
  if (!port.sender || !port.sender?.url) return

  const url = new URL(port.sender.url)

  if (port.sender.url?.includes('sessionId')) {
    const sessionId = url.searchParams.get('sessionId')!

    if (url.pathname.includes('swap-and-bridge')) {
      if (port.name === 'request-window') {
        mainCtrl.onOneClickSwapClose()
      } else {
        mainCtrl.swapAndBridge.unloadScreen(sessionId)
      }
    }

    if (url.pathname.includes('dashboard')) {
      mainCtrl.portfolio.removeDefiSession(sessionId)
    }

    if (url.pathname.includes('dashboard') || url.pathname.includes('transactions')) {
      mainCtrl.activity.resetAccountsOpsFilters(sessionId)
    }

    if (url.pathname.includes('signed-messages')) {
      mainCtrl.activity.resetSignedMessagesFilters(sessionId)
    }
  }

  if (url.pathname.includes('sign-message')) {
    mainCtrl.signMessage.reset()
  }

  if (url.pathname.includes('transfer') || url.pathname.includes('top-up-gas-tank')) {
    // Always unload the screen when the request window is closed
    const isRequestWindow = port.name === 'request-window'

    if (isRequestWindow) {
      mainCtrl.onOneClickTransferClose()
    }

    mainCtrl.activity.resetAccountsOpsFilters('transfer')
  }

  const isOnboardingRoute = ONBOARDING_WEB_ROUTES.some(
    (r) => url.pathname.includes(r) && port.name === 'tab'
  )

  // The logic below ensures that if the onboarding flow was forcefully closed,
  // the AccountsPersonalize screen will not be shown the next time the extension is opened.
  if (isOnboardingRoute) {
    // handles the case when the accountPicker is initialized
    if (mainCtrl.accountPicker.isInitialized) {
      await mainCtrl.accountPicker.reset()
    }

    // handles the case when the accountPicker is not initialized e.g. "import JSON" or "view-only" flows
    if (mainCtrl.accounts.accounts.filter((a) => a.newlyAdded).length) {
      await mainCtrl.accounts.resetAccountsNewlyAddedState()
    }
  }

  // In Firefox, we don't close the request window directly to avoid a bug where closing it also closes the extension popup.
  // Instead, we turn it into a blank, unfocused page. Later, when the popup gets disconnected, we clean up any such leftover blank pages.
  // The rest of the logic is in the remove func in window.ts
  if (IS_FIREFOX && port.name === 'popup') {
    const windows = await chrome.windows.getAll()
    const popupWindows = windows.filter((w) => w.type === 'popup')

    // eslint-disable-next-line no-restricted-syntax
    for (const w of popupWindows) {
      if (w && w.id) {
        // eslint-disable-next-line no-await-in-loop
        const tabs = await chrome.tabs.query({ windowId: w.id })
        if (tabs[0]?.url === 'about:blank' && tabs[0].status !== 'loading') {
          // eslint-disable-next-line no-await-in-loop
          await chrome.windows.remove(w.id)
        }
      }
    }
  }
}
