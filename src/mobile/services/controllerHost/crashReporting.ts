import { stringify } from '@ambire-common/libs/richJson/richJson'
import {
  captureControllerException,
  setCrashReportId,
  setTagContext,
  syncCrashAnalyticsConsent,
  syncPrivacyPoolsAccountSelected
} from '@common/config/analytics/CrashAnalytics'
import {
  createCrashReportAccountTagsSync,
  getCrashReportAccountTags,
  getReportableAction
} from '@common/config/analytics/crashReportHelpers'
import { CRASH_REPORT_ACCOUNT_TAG_CONTROLLERS } from '@common/constants/crashAnalytics'
import { WalletStateController } from '@common/controllers/wallet-state'
import { Action, MethodAction } from '@common/types/actions'

import type { MainController } from '@ambire-common/controllers/main/main'

// The SDK copies every tag and user change to the native layer, so only real changes go out
const syncCrashReportAccountTags = createCrashReportAccountTagsSync(setTagContext)
let lastReportedCrashReportId: string | null | undefined

/** Reports a failure of the controller host itself, like a controller state that can't be serialized. */
export const reportControllerHostError = (error: unknown, controllerName: string) => {
  captureControllerException(error, { extra: { controllerName } })
}

/** Reports a UI action that failed, without the method arguments, which can hold secrets. */
export const reportFailedAction = (action: MethodAction | Action, error: unknown) => {
  console.error(`${action.type} action failed:`, error)
  captureControllerException(error, {
    extra: { action: stringify(getReportableAction(action)) }
  })
}

/**
 * Keeps the crash reporter's id, account traits and consent in step with the controller that
 * just updated. Meant to run on every controller update.
 */
export const syncCrashReportContext = (ctrl: { name: string }, mainCtrl: MainController) => {
  if (CRASH_REPORT_ACCOUNT_TAG_CONTROLLERS.includes(ctrl.name)) {
    syncPrivacyPoolsAccountSelected(mainCtrl.selectedAccount.selectedType === 'privacyPools')
    syncCrashReportAccountTags(
      getCrashReportAccountTags({
        selectedAccount: mainCtrl.selectedAccount.account,
        accountStates: mainCtrl.accounts.accountStates,
        keys: mainCtrl.keystore.keys,
        accounts: mainCtrl.accounts.accounts
      })
    )
    return
  }

  if (ctrl.name === 'WalletStateController') {
    const walletStateCtrl = ctrl as unknown as WalletStateController
    // Before it's ready, the controller holds the defaults instead of the user's stored choices
    if (!walletStateCtrl.isReady) return

    if (walletStateCtrl.crashReportId !== lastReportedCrashReportId) {
      lastReportedCrashReportId = walletStateCtrl.crashReportId
      setCrashReportId(walletStateCtrl.crashReportId)
    }
    syncCrashAnalyticsConsent(walletStateCtrl.crashAnalyticsEnabled)
  }
}
