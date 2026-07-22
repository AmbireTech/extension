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
  await Promise.all([
    awaitInitialLoad(mainCtrl.keystore),
    awaitInitialLoad(mainCtrl.accounts),
    awaitInitialLoad(mainCtrl.requests),
    awaitInitialLoad(mainCtrl.swapAndBridge),
    awaitInitialLoad(mainCtrl.transfer),
    awaitInitialLoad(mainCtrl.survey)
  ])

  // `getInitialRoute` uses authStatus only to detect the not-authenticated case,
  // which is fully determined by whether any account exists. The richer UI check
  // (selectedAccount readiness) loads after the portfolio and isn't needed here.
  const authStatus = mainCtrl.accounts.accounts.length
    ? AUTH_STATUS.AUTHENTICATED
    : AUTH_STATUS.NOT_AUTHENTICATED

  return getInitialRoute({
    keystoreState: mainCtrl.keystore,
    authStatus,
    requestsState: mainCtrl.requests,
    swapAndBridgeState: mainCtrl.swapAndBridge,
    transferState: mainCtrl.transfer,
    surveyState: mainCtrl.survey,
    isRequestWindow
  })
}
