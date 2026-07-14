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
 * to report to Sentry. Other action types have explicitly typed, non-secret params.
 */
export const getReportableAction = (action: MethodAction | Action): RedactedMethodAction | Action =>
  action.type === 'method'
    ? { type: action.type, params: { ctrlName: action.params.ctrlName, method: action.params.method } }
    : action
