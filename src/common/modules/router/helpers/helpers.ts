import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { IRequestsController } from '@ambire-common/interfaces/requests'
import { ISurveyController } from '@ambire-common/interfaces/survey'
import { ISwapAndBridgeController } from '@ambire-common/interfaces/swapAndBridge'
import { ITransferController } from '@ambire-common/interfaces/transfer'
import { REQUEST_VIEW_TYPE, View } from '@ambire-common/interfaces/ui'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import { ROUTES } from '@common/modules/router/constants/common'
import { awaitControllersInitialLoad } from '@common/utils/controllers'

import type { MainController } from '@ambire-common/controllers/main/main'

/**
 * Maps the current user request to the route that renders it. Shared between the request
 * window's initial route resolution and the side panel, which renders the same action
 * screens in-place (over the dashboard) instead of opening a separate window.
 */
const getRouteForUserRequest = ({
  currentUserRequest,
  transferState
}: {
  currentUserRequest: IRequestsController['currentUserRequest']
  transferState: ITransferController
}): string | null => {
  if (!currentUserRequest) return null

  if (currentUserRequest.kind === 'dappConnect') return ROUTES.dappConnectRequest
  if (currentUserRequest.kind === 'walletAddEthereumChain') return ROUTES.addChain
  if (currentUserRequest.kind === 'walletWatchAsset') return ROUTES.watchAsset
  if (currentUserRequest.kind === 'ethGetEncryptionPublicKey')
    return ROUTES.getEncryptionPublicKeyRequest
  if (currentUserRequest.kind === 'ethDecrypt') return ROUTES.decryptRequest
  if (currentUserRequest.kind === 'calls') return ROUTES.signAccountOp

  if (
    currentUserRequest.kind === 'message' ||
    currentUserRequest.kind === 'typedMessage' ||
    currentUserRequest.kind === 'authorization-7702' ||
    currentUserRequest.kind === 'siwe'
  )
    return ROUTES.signMessage

  if (currentUserRequest.kind === 'swapAndBridge') return ROUTES.swapAndBridge

  if (currentUserRequest.kind === 'transfer')
    return transferState.isTopUp ? ROUTES.topUpGasTank : ROUTES.transfer

  if (currentUserRequest.kind === 'benzin') {
    return (
      ROUTES.benzin +
      getBenzinUrlParams({
        chainId: currentUserRequest.meta.chainId,
        isInternal: true,
        txnId: currentUserRequest.meta?.txnId, // can be undefined
        identifiedBy: currentUserRequest.meta?.identifiedBy
      })
    )
  }

  if (currentUserRequest.kind === 'switchAccount') return ROUTES.switchAccount

  return null
}

const getInitialRoute = ({
  keystoreState,
  authStatus,
  requestsState,
  swapAndBridgeState,
  transferState,
  surveyState,
  isRequestWindow,
  isSidePanel
}: {
  keystoreState: IKeystoreController
  authStatus?: AUTH_STATUS
  requestsState: IRequestsController
  swapAndBridgeState: ISwapAndBridgeController
  transferState: ITransferController
  surveyState?: ISurveyController
  isRequestWindow: boolean
  isSidePanel?: boolean
}) => {
  if (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) {
    return ROUTES.keyStoreUnlock
  }

  if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED) {
    // Full onboarding is tab-only; side panel shows a dedicated empty-state page.
    return isSidePanel ? ROUTES.sidePanelNoAccounts : ROUTES.getStarted
  }

  if (isRequestWindow && requestsState.currentUserRequest) {
    return getRouteForUserRequest({
      currentUserRequest: requestsState.currentUserRequest,
      transferState
    })
  } else if (!isRequestWindow) {
    // TODO: Always redirects to Dashboard, which for initial extension load is okay, but
    // for other scenarios, ideally, it should be the last route before the keystore got locked.
    const hasSwapAndBridgePersistentSession = swapAndBridgeState.sessionIds.some(
      (id) => id === 'popup' || id === 'request-window'
    )

    if (hasSwapAndBridgePersistentSession) {
      return ROUTES.swapAndBridge
    }
    if (transferState?.hasPersistedState) {
      if (transferState.isTopUp) {
        return ROUTES.topUpGasTank
      }
      return ROUTES.transfer
    }
    if (surveyState && surveyState.hasPersistentState) return ROUTES.survey
    return ROUTES.dashboard
  }

  return null
}

/**
 * Tells where a view should be, based on the state of the controllers its screens depend on.
 * Awaits the initial load of only those controllers, so the route is known without syncing every
 * controller's state to the UI first. A `null` answer means the view has nowhere to go.
 */
const resolveViewRoute = async (mainCtrl: MainController, view: View): Promise<string | null> => {
  const routeControllers = {
    keystoreState: mainCtrl.keystore,
    requestsState: mainCtrl.requests,
    swapAndBridgeState: mainCtrl.swapAndBridge,
    transferState: mainCtrl.transfer,
    surveyState: mainCtrl.survey
  }

  await awaitControllersInitialLoad([...Object.values(routeControllers), mainCtrl.accounts])

  const authStatus = mainCtrl.accounts.accounts.length
    ? AUTH_STATUS.AUTHENTICATED
    : AUTH_STATUS.NOT_AUTHENTICATED

  return getInitialRoute({
    ...routeControllers,
    authStatus,
    isRequestWindow: view.type === REQUEST_VIEW_TYPE,
    isSidePanel: view.type === 'side-panel'
  })
}

/**
 * Puts a route in the form the router reports it in, so the two can be compared. `ROUTES` values
 * carry no leading slash while a location's pathname always does.
 */
const toAbsoluteRoute = (route: string) => (route.startsWith('/') ? route : `/${route}`)

export { getInitialRoute, resolveViewRoute, toAbsoluteRoute, getRouteForUserRequest }
