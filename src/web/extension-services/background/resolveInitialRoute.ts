import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import { getInitialRoute } from '@common/modules/router/helpers'

import type { MainController } from '@ambire-common/controllers/main/main'

const awaitInitialLoad = (ctrl: object): Promise<void> | undefined =>
  (ctrl as { initialLoadPromise?: Promise<void> }).initialLoadPromise

/**
 * Computes the initial route in the background so the UI can navigate without
 * first syncing every controller's state across the port.
 */
export const resolveInitialRoute = async (
  mainCtrl: MainController,
  isRequestWindow: boolean
): Promise<string | null> => {
  // Await only the controllers we need for getInitialRoute
  const routeControllers = {
    keystoreState: mainCtrl.keystore,
    requestsState: mainCtrl.requests,
    swapAndBridgeState: mainCtrl.swapAndBridge,
    transferState: mainCtrl.transfer,
    surveyState: mainCtrl.survey
  }

  await Promise.all([...Object.values(routeControllers), mainCtrl.accounts].map(awaitInitialLoad))

  const authStatus = mainCtrl.accounts.accounts.length
    ? AUTH_STATUS.AUTHENTICATED
    : AUTH_STATUS.NOT_AUTHENTICATED

  return getInitialRoute({ ...routeControllers, authStatus, isRequestWindow })
}
