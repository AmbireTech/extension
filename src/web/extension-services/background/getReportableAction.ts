import { Action, MethodAction } from '../../../common/types/actions'

type RedactedMethodAction = {
  type: 'method'
  params: {
    ctrlName: MethodAction['params']['ctrlName']
    method: MethodAction['params']['method']
  }
}

/**
 * `method` actions carry positional `args` mapped onto arbitrary controller method
 * parameters (may include passwords/secrets), so only their ctrlName/method are safe
 * to report to Sentry.
 *
 * Other action types are passed through unredacted here -- their params are typed
 * per action, but that does NOT guarantee they're secret-free (e.g. `ImportSmartAccountJson`
 * carries a raw `privateKey` per key). Today those cases are only caught by
 * `scrubSentryEventSecrets`'s key-name-based redaction (see sentryDataScrubbing.ts) as a
 * downstream safety net, not by this function. If you add a new action type whose params
 * can carry a secret, either redact it here explicitly or make sure the field name matches
 * SENSITIVE_KEY_SUBSTRINGS in sentryDataScrubbing.ts -- don't assume this function covers it.
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
