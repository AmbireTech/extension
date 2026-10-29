import type { MainController } from '@ambire-common/controllers/main/main'
import { ONBOARDING_WEB_ROUTES, ROUTES } from '@common/modules/router/constants/common'
import { IS_FIREFOX } from '@web/constants/common'
import { forgetPanelWindowId } from '@web/extension-services/background/webapi/panel'
import { captureBackgroundException } from '@web/extension-services/background/CrashAnalytics'
import { Port } from '@web/extension-services/messengers'

// Long enough for a reloaded tab to come back and report its route
const PERSONALIZE_RELOAD_GRACE_MS = 10000

let personalizeResetTimeout: ReturnType<typeof setTimeout> | undefined

/**
 * Drops the accounts prepared on personalize once its tab is closed for good. A reload disconnects
 * the tab the same way, so this waits and skips the reset if a tab is back in an onboarding step.
 */
const resetPreparedAccountsUnlessReopened = (mainCtrl: MainController) => {
  clearTimeout(personalizeResetTimeout)
  personalizeResetTimeout = setTimeout(() => {
    personalizeResetTimeout = undefined
    const isOnboardingTabOpen = mainCtrl.ui.views.some(
      (v) => v.type === 'tab' && !!v.currentRoute && ONBOARDING_WEB_ROUTES.includes(v.currentRoute)
    )
    if (isOnboardingTabOpen) return

    mainCtrl.accountPicker.reset().catch((error: unknown) => {
      console.error('Failed to reset the accounts left on personalize', error)
      captureBackgroundException(error)
    })
  }, PERSONALIZE_RELOAD_GRACE_MS)
}

export const handleCleanUpOnPortDisconnect = async ({
  port,
  mainCtrl,
  isSidePanelModeEnabled
}: {
  port: Port
  mainCtrl: MainController
  isSidePanelModeEnabled: boolean
}) => {
  if (port.name === 'side-panel') {
    forgetPanelWindowId(port.id)

    // The panel renders action requests inline, so closing it discards their UI. Handle the
    // pending requests like a request window close: transactions stay queued, the rest get
    // rejected. Skipped while another panel or a request window still shows the request.
    // Nothing is discarded while panel mode is off: turning it off moves a pending app request to a
    // request window instead and leaves transactions queued (see background.ts) - and on Firefox
    // the sidebar can be open while the mode is off, showing the "mode off" notice, which never
    // showed the requests.
    // The closed panel's port is already gone, so this only counts the panels still open (every
    // open panel shows the current request), with the same checks that decide where requests go.
    const isAnotherPanelOpen = !!mainCtrl.ui.panel?.isOpen()
    const isRequestInOwnWindow = !!mainCtrl.requests.requestWindow.windowProps

    // Not counted against the apps that were waiting - a port also drops on an extension
    // reload or a service worker restart, which is not the user refusing anything.
    if (isSidePanelModeEnabled && !isAnotherPanelOpen && !isRequestInOwnWindow)
      await mainCtrl.requests.closeRequestWindow({ isUserInitiated: false })
  }

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

  // Only the tab that runs the account adding flow ends it - closing another onboarding tab
  // (e.g. one left on "wallet-setup-completed") would kill an import running in a different tab.
  const isAccountAddingFlowRoute = [
    ROUTES.keyStoreSetup,
    ROUTES.accountPicker,
    ROUTES.accountPersonalize
  ].some((r) => url.pathname.includes(r))

  // An account adding flow closed midway is dropped, so it does not come back the next time
  // the extension is opened - unless it was closed on its last step: the prepared accounts
  // (or removals) wait there, for the user to add or go back from (see `getInitialRoute`).
  // With accounts in the wallet nothing leads back there, so they are dropped too, after the
  // grace period that keeps them over a reload.
  if (isOnboardingRoute && isAccountAddingFlowRoute) {
    const { isInitialized, initParams, readyToAddAccounts, readyToRemoveAccounts } =
      mainCtrl.accountPicker
    const isOnPersonalizeStep = url.pathname.includes(ROUTES.accountPersonalize)
    const isWaitingToBeAdded =
      isOnPersonalizeStep && (!!readyToAddAccounts.length || !!readyToRemoveAccounts.length)

    const hasFlow =
      isInitialized || !!initParams || !!readyToAddAccounts.length || !!readyToRemoveAccounts.length

    if (hasFlow && !isWaitingToBeAdded) {
      await mainCtrl.accountPicker.reset()
    } else if (isWaitingToBeAdded && mainCtrl.selectedAccount.selectedType) {
      resetPreparedAccountsUnlessReopened(mainCtrl)
    }
  }

  // In Firefox, we don't close the request window directly to avoid a bug where closing it also closes the extension popup.
  // Instead, we turn it into a blank, unfocused page. Later, when the popup gets disconnected, we clean up any such leftover blank pages.
  // The rest of the logic is in the remove func in window.ts
  if (IS_FIREFOX && port.name === 'popup') {
    const windows = await chrome.windows.getAll()
    const popupWindows = windows.filter((w) => w.type === 'popup')

    for (const w of popupWindows) {
      if (w && w.id) {
        const tabs = await chrome.tabs.query({ windowId: w.id })
        if (tabs[0]?.url === 'about:blank' && tabs[0].status !== 'loading') {
          await chrome.windows.remove(w.id)
        }
      }
    }
  }
}
