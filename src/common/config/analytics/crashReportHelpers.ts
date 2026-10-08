import { ErrorRef } from '@ambire-common/interfaces/eventEmitter'
import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { ISelectedAccountController } from '@ambire-common/interfaces/selectedAccount'
import { isTesting } from '@common/config/env'
import { Action, MethodAction } from '@common/types/actions'
import { getAppInstanceId } from '@common/utils/analytics'

/**
 * Gives back the Sentry integrations without the ones named in `excludedNames`. Meant for the
 * `integrations` option in its function form, to switch off single SDK defaults.
 */
export const excludeIntegrationsByName = <T extends { name: string }>(
  integrations: T[],
  excludedNames: readonly string[]
): T[] => integrations.filter(({ name }) => !excludedNames.includes(name))

/**
 * The part of a Sentry client this needs. Kept structural so the extension's and the mobile
 * app's clients, which come from different `@sentry/core` copies, both fit.
 */
type SentryDeliveryObservableClient = {
  on(
    hook: 'afterSendEvent',
    callback: (
      event: { type?: string; event_id?: string },
      sendResponse: { statusCode?: number }
    ) => void
  ): unknown
}

/**
 * In testing builds, logs every event Sentry delivers, so a report that never left the app can be
 * told apart from no error at all. Call it right after `Sentry.init` with that package's client.
 */
export const logSentryDeliveryWhenTesting = (
  client: SentryDeliveryObservableClient | undefined
) => {
  if (!isTesting || !client) return

  client.on('afterSendEvent', (event, sendResponse) => {
    console.log(
      `[sentry] delivered ${event.type || 'error'} event ${event.event_id} with status ${
        sendResponse.statusCode
      }`
    )
  })
}

type RedactedMethodAction = {
  type: 'method'
  params: {
    ctrlName: MethodAction['params']['ctrlName']
    method: MethodAction['params']['method']
  }
}

/**
 * Gives the action in a form safe to attach to a crash report. A `method` action keeps only its
 * ctrlName and method, since its args can hold passwords. Every other action passes through as is,
 * so a new action with a secret in its params needs redacting here or a key name that
 * `SENSITIVE_KEY_SUBSTRINGS` in sentryDataScrubbing.ts catches.
 */
export const getReportableAction = (
  action: MethodAction | Action
): RedactedMethodAction | Action =>
  action.type === 'method'
    ? {
        type: action.type,
        params: { ctrlName: action.params.ctrlName, method: action.params.method }
      }
    : action

/**
 * Whether a controller error should become a crash report. Gives false when the controller
 * opted out with `sendCrashReport: false` or marked the error as `expected`.
 */
export const shouldReportControllerError = (
  errorRef: Partial<Pick<ErrorRef, 'level' | 'sendCrashReport'>>
): boolean =>
  !(typeof errorRef.sendCrashReport === 'boolean' && !errorRef.sendCrashReport) &&
  errorRef.level !== 'expected'

/**
 * The anonymous user ID that crash reports carry, shared by the extension background and the
 * mobile app. Gives undefined until the keystore is ready to store keys.
 */
export const getCrashReportUserId = (
  keystoreCtrl: Pick<IKeystoreController, 'isReadyToStoreKeys' | 'keyStoreUid'>,
  verifiedInviteCode: string | null
): string | undefined =>
  keystoreCtrl.isReadyToStoreKeys
    ? getAppInstanceId(keystoreCtrl.keyStoreUid, verifiedInviteCode)
    : undefined

/**
 * The selected account address that crash reports carry, shared by the extension background and
 * the mobile app. Gives undefined when no account is selected.
 */
export const getCrashReportAccountAddr = (
  selectedAccountCtrl: Pick<ISelectedAccountController, 'account'>
): string | undefined => selectedAccountCtrl.account?.addr
