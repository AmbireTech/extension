import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import { getInitialRoute } from '@common/modules/router/helpers'

import type { MainController } from '@ambire-common/controllers/main/main'

// Every controller extends EventEmitter and exposes `initialLoadPromise` at
// runtime, but most controller interfaces don't declare it. Read it through a
// local cast at this trusted boundary so we can await it uniformly.
const awaitInitialLoad = (ctrl: object): Promise<void> | undefined =>
  (ctrl as { initialLoadPromise?: Promise<void> }).initialLoadPromise

// Computes the initial route in the background so the UI can navigate without
// first syncing every controller's state across the port.
//
// We deliberately await only the light, storage-backed controllers the route
// depends on — never `mainCtrl.initialLoadPromise`, which also waits for the
// portfolio (network calls), providers and domains. `getInitialRoute` only needs
// the keystore lock state, whether any account exists, and the persisted
// session flags, all of which are ready once these promises resolve.
export const resolveInitialRoute = async (
  mainCtrl: MainController,
  isRequestWindow: boolean
): Promise<string | null> => {
  // Single source of truth: the controllers whose persisted state `getInitialRoute`
  // reads. The await list below and the args passed to `getInitialRoute` are both
  // derived from this object, so they cannot drift — and `getInitialRoute`'s
  // required args compile-enforce that every controller it reads is listed here.
  const routeControllers = {
    keystoreState: mainCtrl.keystore,
    requestsState: mainCtrl.requests,
    swapAndBridgeState: mainCtrl.swapAndBridge,
    transferState: mainCtrl.transfer,
    surveyState: mainCtrl.survey
  }

  // `accounts` gates authStatus (it isn't passed as a state object), so await it
  // alongside the rest. Note: swapAndBridge and transfer expose `initialLoadPromise`
  // privately, so their await here is a no-op — acceptable, because that promise is
  // only pending during the very first load, when there is no persisted swap/transfer
  // session to restore anyway (on later resolves it is already resolved).
  await Promise.all([...Object.values(routeControllers), mainCtrl.accounts].map(awaitInitialLoad))

  // `getInitialRoute` uses authStatus only to detect the not-authenticated case,
  // which is fully determined by whether any account exists. The richer UI check
  // (selectedAccount readiness) loads after the portfolio and isn't needed here.
  const authStatus = mainCtrl.accounts.accounts.length
    ? AUTH_STATUS.AUTHENTICATED
    : AUTH_STATUS.NOT_AUTHENTICATED

  return getInitialRoute({ ...routeControllers, authStatus, isRequestWindow })
}
