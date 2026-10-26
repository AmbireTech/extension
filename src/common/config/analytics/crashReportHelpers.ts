import { Account, AccountStates } from '@ambire-common/interfaces/account'
import { ErrorRef } from '@ambire-common/interfaces/eventEmitter'
import { Key } from '@ambire-common/interfaces/keystore'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { isTesting } from '@common/config/env'
import {
  CRASH_REPORT_ACCOUNT_COUNT,
  CRASH_REPORT_ACCOUNT_TAGS,
  CRASH_REPORT_ACCOUNT_TYPE,
  CRASH_REPORT_FEW_ACCOUNTS_MAX,
  CRASH_REPORT_KEY_TYPE,
  CrashReportAccountTagKey
} from '@common/constants/crashAnalytics'
import { Action, MethodAction } from '@common/types/actions'

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
 * Reports an error a controller emitted with the given capture function, unless the controller
 * marked it as expected or opted out of crash reports for it. Shared by the extension background
 * and the mobile app, which each pass their own capture function.
 */
export const reportControllerError = (
  errorRef: ErrorRef,
  controllerName: string,
  capture: (exception: unknown, captureContext: { extra: { controllerName: string } }) => unknown
) => {
  if (!shouldReportControllerError(errorRef)) return

  capture(errorRef.error, { extra: { controllerName } })
}

type CrashReportAccountTags = Partial<Record<CrashReportAccountTagKey, string>>

/**
 * Describes the selected account by its traits, in place of its address, which would identify the
 * user. Gives an empty object when no account is selected. The key type is `internal` when any key
 * of the account is stored in the wallet, `hardware` when all of them are on external devices and
 * `none` for a view-only account.
 */
export const getCrashReportAccountTags = ({
  selectedAccount,
  accountStates,
  keys,
  accounts
}: {
  selectedAccount: Account | null | undefined
  accountStates: AccountStates
  keys: Key[]
  accounts: Account[]
}): CrashReportAccountTags => {
  if (!selectedAccount) return {}

  const isSmarterEoa = Object.values(accountStates[selectedAccount.addr] || {}).some(
    (state) => state.isSmarterEoa
  )
  let accountType: string = CRASH_REPORT_ACCOUNT_TYPE.EOA
  if (isSmartAccount(selectedAccount)) accountType = CRASH_REPORT_ACCOUNT_TYPE.SMART
  else if (isSmarterEoa) accountType = CRASH_REPORT_ACCOUNT_TYPE.SMARTER_EOA

  const accountKeys = keys.filter((key) => selectedAccount.associatedKeys.includes(key.addr))
  let keyType: string = CRASH_REPORT_KEY_TYPE.NONE
  if (accountKeys.some((key) => key.type === 'internal')) keyType = CRASH_REPORT_KEY_TYPE.INTERNAL
  else if (accountKeys.length) keyType = CRASH_REPORT_KEY_TYPE.HARDWARE

  let accountCount: string = CRASH_REPORT_ACCOUNT_COUNT.MANY
  if (accounts.length <= 1) accountCount = CRASH_REPORT_ACCOUNT_COUNT.ONE
  else if (accounts.length <= CRASH_REPORT_FEW_ACCOUNTS_MAX)
    accountCount = CRASH_REPORT_ACCOUNT_COUNT.FEW

  return {
    [CRASH_REPORT_ACCOUNT_TAGS.ACCOUNT_TYPE]: accountType,
    [CRASH_REPORT_ACCOUNT_TAGS.KEY_TYPE]: keyType,
    [CRASH_REPORT_ACCOUNT_TAGS.ACCOUNT_COUNT]: accountCount
  }
}

/**
 * Gives a function that puts account tags on a Sentry scope with the given `setTag`, clearing the
 * ones no longer present. It skips the call when the tags are the same as last time, as the mobile
 * SDK copies every scope change to the native layer. Each context (background, UI, mobile) makes
 * its own, since each has its own Sentry scope.
 */
export const createCrashReportAccountTagsSync = (
  setTag: (key: CrashReportAccountTagKey, value: string | undefined) => void
) => {
  let lastTags: CrashReportAccountTags = {}

  return (tags: CrashReportAccountTags) => {
    Object.values(CRASH_REPORT_ACCOUNT_TAGS).forEach((key) => {
      if (tags[key] === lastTags[key]) return

      setTag(key, tags[key])
    })
    lastTags = tags
  }
}
