import { ErrorRef } from '@ambire-common/interfaces/eventEmitter'
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
  getReportableAction,
  shouldReportControllerError
} from '@common/config/analytics/crashReportHelpers'
import { WalletStateController } from '@common/controllers/wallet-state'
import { Action, MethodAction } from '@common/types/actions'
import { getAppInstanceId } from '@common/utils/analytics'

import type { MainController } from '@ambire-common/controllers/main/main'

// The SDK copies every user and extra change to the native layer, so only real changes go out
let lastReportedUserId: string | undefined
let lastReportedAccountAddr: string | undefined

/**
 * Reports an error a controller emitted, unless the controller marked it as expected or opted
 * out of crash reports for it.
 */
export const reportControllerError = (errorRef: ErrorRef, controllerName: string) => {
  if (!shouldReportControllerError(errorRef)) return

  captureControllerException(errorRef.error, { extra: { controllerName } })
}

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
    const keystoreCtrl = ctrl as unknown as IKeystoreController
    if (!keystoreCtrl.isReadyToStoreKeys) return

    const userId = getAppInstanceId(keystoreCtrl.keyStoreUid, mainCtrl.invite.verifiedCode)
    if (userId === lastReportedUserId) return

    lastReportedUserId = userId
    setUserContext({ id: userId })
    return
  }

  if (ctrl.name === 'SelectedAccountController') {
    const accountAddr = (ctrl as unknown as ISelectedAccountController).account?.addr
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
