import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { IRequestsController } from '@ambire-common/interfaces/requests'
import { ISwapAndBridgeController } from '@ambire-common/interfaces/swapAndBridge'
import { ITransferController } from '@ambire-common/interfaces/transfer'
import { getBenzinUrlParams } from '@ambire-common/utils/benzin'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import { ROUTES } from '@common/modules/router/constants/common'
import { getUiType } from '@web/utils/uiType'

const { isRequestWindow } = getUiType()

const getInitialRoute = ({
  keystoreState,
  authStatus,
  requestsState,
  swapAndBridgeState,
  transferState
}: {
  keystoreState: IKeystoreController
  authStatus: AUTH_STATUS
  requestsState: IRequestsController
  swapAndBridgeState: ISwapAndBridgeController
  transferState: ITransferController
}) => {
  if (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) {
    return ROUTES.keyStoreUnlock
  }

  if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED) {
    return ROUTES.getStarted
  }

  if (isRequestWindow && requestsState.currentUserRequest) {
    const { currentUserRequest } = requestsState
    if (currentUserRequest.kind === 'dappConnect') return ROUTES.dappConnectRequest

    if (currentUserRequest.kind === 'walletAddEthereumChain') return ROUTES.addChain

    if (currentUserRequest.kind === 'walletWatchAsset') return ROUTES.watchAsset

    if (currentUserRequest.kind === 'ethGetEncryptionPublicKey')
      return ROUTES.getEncryptionPublicKeyRequest

    if (currentUserRequest.kind === 'calls') return ROUTES.signAccountOp

    if (currentUserRequest.kind === 'message') return ROUTES.signMessage

    if (currentUserRequest.kind === 'typedMessage') return ROUTES.signMessage

    if (currentUserRequest.kind === 'siwe') return ROUTES.signMessage

    if (currentUserRequest.kind === 'authorization-7702') return ROUTES.signMessage

    if (currentUserRequest.kind === 'swapAndBridge') return ROUTES.swapAndBridge

    // TODO: This navigation occurs when signing with Trezor.
    // Currently, Gas Top-Ups are not supported by Trezor.
    // Once support is added, we need to introduce a new actionType specifically for Top-Up.
    if (currentUserRequest.kind === 'transfer') return ROUTES.transfer

    if (currentUserRequest.kind === 'benzin') {
      const link =
        ROUTES.benzin +
        getBenzinUrlParams({
          chainId: currentUserRequest.meta.chainId,
          isInternal: true,
          txnId: currentUserRequest.meta?.txnId, // can be undefined
          identifiedBy: currentUserRequest.meta?.identifiedBy
        })
      return link
    }

    if (currentUserRequest.kind === 'switchAccount') return ROUTES.switchAccount
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
    return ROUTES.dashboard
  }

  return null
}

export { getInitialRoute }
