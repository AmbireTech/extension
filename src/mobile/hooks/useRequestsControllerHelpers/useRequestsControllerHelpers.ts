import { useEffect, useMemo, useRef } from 'react'
import { useModalize } from 'react-native-modalize'

import useControllerState from '@common/hooks/useControllerState'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useRoute from '@common/hooks/useRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import { getInitialRoute } from '@common/modules/router/helpers'
import eventBus from '@common/services/event/eventBus'
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

  // Timeout ref for the 1000ms delay matching extension behavior
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Track if bottom sheet is currently open
  const isBottomSheetOpenRef = useRef(false)

  const onBottomSheetClosed = useMemo(
    () => () => {
      isBottomSheetOpenRef.current = false
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

  useEffect(() => {
    const handleWindowAction = (payload: { type: string; winId: number }) => {
      if (!isOnDappWebView) return

      if (payload.type === 'open' || payload.type === 'focus') {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current)
          closeTimeoutRef.current = null
        }
        if (!isBottomSheetOpenRef.current) {
          openRequestModal()
          isBottomSheetOpenRef.current = true
        }
      } else if (payload.type === 'remove') {
        if (isBottomSheetOpenRef.current) closeRequestModal()
      }
    }

    eventBus.addEventListener('ui.window.action', handleWindowAction)
    return () => {
      eventBus.removeEventListener('ui.window.action', handleWindowAction)
    }
  }, [isOnDappWebView, openRequestModal, closeRequestModal])

  // Independent backup: close bottom sheet after 1000ms if shouldOpenBottomSheet
  // is false. This is a safety net that should rarely trigger since window events
  // handle the normal flow. It ensures the sheet eventually closes if state gets
  // out of sync.
  useEffect(() => {
    if (!isOnDappWebView) return

    if (!shouldOpenBottomSheet && isBottomSheetOpenRef.current) {
      closeTimeoutRef.current = setTimeout(() => {
        if (isBottomSheetOpenRef.current) {
          closeRequestModal()
        }
        closeTimeoutRef.current = null
      }, 1000)
    }

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [shouldOpenBottomSheet, isOnDappWebView, closeRequestModal])

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
