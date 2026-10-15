import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { ISelectedAccountController } from '@ambire-common/interfaces/selectedAccount'
import { stringify } from '@ambire-common/libs/richJson/richJson'
import {
  captureControllerException,
  setExtraContext,
  setUserContext,
  syncCrashAnalyticsConsent
} from '@common/config/analytics/CrashAnalytics'
import {
  getCrashReportAccountAddr,
  getCrashReportUserId,
  getReportableAction
} from '@common/config/analytics/crashReportHelpers'
import { WalletStateController } from '@common/controllers/wallet-state'
import { Action, MethodAction } from '@common/types/actions'

import type { MainController } from '@ambire-common/controllers/main/main'

// The SDK copies every user and extra change to the native layer, so only real changes go out
let lastReportedUserId: string | undefined
let lastReportedAccountAddr: string | undefined

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
 * Keeps the crash reporter's anonymous user ID, selected account and consent in step with the
 * controller that just updated. Meant to run on every controller update.
 */
export const syncCrashReportContext = (ctrl: { name: string }, mainCtrl: MainController) => {
  if (ctrl.name === 'KeystoreController') {
    const userId = getCrashReportUserId(
      ctrl as unknown as IKeystoreController,
      mainCtrl.invite.verifiedCode
    )
    if (userId === undefined || userId === lastReportedUserId) return

    lastReportedUserId = userId
    setUserContext({ id: userId })
    return
  }

  if (ctrl.name === 'SelectedAccountController') {
    const accountAddr = getCrashReportAccountAddr(ctrl as unknown as ISelectedAccountController)
    if (!accountAddr || accountAddr === lastReportedAccountAddr) return

    lastReportedAccountAddr = accountAddr
    setExtraContext('account', accountAddr)
    return
  }

  if (ctrl.name === 'WalletStateController') {
    const walletStateCtrl = ctrl as unknown as WalletStateController
    // Before it's ready, the controller holds the default instead of the user's stored choice
    if (!walletStateCtrl.isReady) return

    syncCrashAnalyticsConsent(walletStateCtrl.crashAnalyticsEnabled)
  }
}
