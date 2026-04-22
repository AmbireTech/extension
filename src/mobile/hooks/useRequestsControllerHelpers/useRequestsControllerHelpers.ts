import { useEffect, useMemo } from 'react'
import { useModalize } from 'react-native-modalize'

import useControllerState from '@common/hooks/useControllerState'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import { getInitialRoute } from '@common/modules/router/helpers'
import { Action, MethodAction } from '@common/types/actions'
import { getUiType } from '@common/utils/uiType'

export type BottomSheetRequestType =
  | 'dappConnect'
  | 'calls'
  | 'walletAddEthereumChain'
  | 'walletWatchAsset'
  | 'ethGetEncryptionPublicKey'
  | 'ethDecrypt'
  | 'switchAccount'
  | 'message'
  | 'typedMessage'
  | 'siwe'
  | 'authorization-7702'
  | 'benzin'
  | null

export default function useRequestsControllerHelpers(
  dispatch: (action: Action | MethodAction) => void
) {
  const { navigate } = useNavigation()

  const { state: requestsState, updateHelpers } = useControllerState({
    id: 'RequestsController',
    subscriptionEnabled: true
  })
  const { state: keystoreState } = useControllerState({ id: 'KeystoreController' })
  const { state: swapAndBridgeState } = useControllerState({ id: 'SwapAndBridgeController' })
  const { state: transferState } = useControllerState({ id: 'TransferController' })

  const prevCurrentUserRequestId = usePrevious(requestsState?.currentUserRequest?.id)

  const route = useRoute()
  const currentPathname = route.pathname.startsWith('/') ? route.pathname.slice(1) : route.pathname
  const prevPathname = usePrevious(currentPathname)

  const isOnDappWebView = currentPathname === ROUTES.dappWebView

  // Modalize hook for the bottom sheet
  const { ref: requestModalRef, open: openRequestModal, close: closeRequestModal } = useModalize()

  const onBottomSheetClosed = useMemo(
    () => () => {
      dispatch({ type: 'WINDOW_REMOVED', params: { id: 1 } })
    },
    [dispatch]
  )

  // Determine if current request should be shown in bottom sheet
  const bottomSheetRequestType: BottomSheetRequestType = useMemo(() => {
    if (!isOnDappWebView || !requestsState?.currentUserRequest) return null

    const supportedBottomSheetKinds: BottomSheetRequestType[] = [
      'dappConnect',
      'calls',
      'walletAddEthereumChain',
      'walletWatchAsset',
      'ethGetEncryptionPublicKey',
      'ethDecrypt',
      'switchAccount',
      'message',
      'typedMessage',
      'siwe',
      'authorization-7702',
      'benzin'
    ]

    const kind = requestsState.currentUserRequest.kind
    return supportedBottomSheetKinds.includes(kind as BottomSheetRequestType)
      ? (kind as BottomSheetRequestType)
      : null
  }, [isOnDappWebView, requestsState?.currentUserRequest])

  const shouldOpenBottomSheet = bottomSheetRequestType !== null

  useEffect(() => {
    const wasOnActionRequestScreen =
      prevPathname === ROUTES.signAccountOp || prevPathname === ROUTES.benzin
    const isOnActionRequestScreen =
      currentPathname === ROUTES.signAccountOp || currentPathname === ROUTES.benzin

    if (wasOnActionRequestScreen && !isOnActionRequestScreen) {
      dispatch({ type: 'WINDOW_REMOVED', params: { id: 1 } })
    }
  }, [currentPathname, prevPathname, dispatch])

  useEffect(() => {
    // If on dapp webview, don't navigate - the bottom sheet will handle it
    if (isOnDappWebView) return

    if (
      (getUiType().isRequestWindow || getUiType().isMobileApp) &&
      prevCurrentUserRequestId !== requestsState?.currentUserRequest?.id
    ) {
      setTimeout(() => {
        const initialRoute = getInitialRoute({
          keystoreState,
          requestsState,
          swapAndBridgeState,
          transferState
        })
        if (initialRoute) navigate(initialRoute)
      })
    }
  }, [
    prevCurrentUserRequestId,
    requestsState?.currentUserRequest?.id,
    navigate,
    keystoreState,
    requestsState,
    swapAndBridgeState,
    transferState,
    isOnDappWebView
  ])

  // Control bottom sheet based on shouldOpenBottomSheet
  useEffect(() => {
    if (shouldOpenBottomSheet) {
      openRequestModal()
    } else {
      closeRequestModal()
    }
  }, [shouldOpenBottomSheet, openRequestModal, closeRequestModal])

  // Update helpers so they are available via useController('RequestsController')
  useEffect(() => {
    updateHelpers({
      requestModalRef,
      openRequestModal,
      closeRequestModal,
      bottomSheetRequestType,
      shouldOpenBottomSheet,
      onBottomSheetClosed
    })
  }, [
    updateHelpers,
    requestModalRef,
    openRequestModal,
    closeRequestModal,
    bottomSheetRequestType,
    shouldOpenBottomSheet,
    onBottomSheetClosed
  ])
}
