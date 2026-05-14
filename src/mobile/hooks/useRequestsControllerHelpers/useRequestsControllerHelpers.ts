import { useEffect, useMemo, useRef } from 'react'
import { useModalize } from 'react-native-modalize'

import useControllerState from '@common/hooks/useControllerState'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import eventBus from '@common/services/event/eventBus'
import { Action, MethodAction } from '@common/types/actions'

export default function useRequestsControllerHelpers(
  dispatch: (action: Action | MethodAction) => void
) {
  const { state: requestsState, updateHelpers } = useControllerState({
    id: 'RequestsController',
    subscriptionEnabled: true
  })

  const { state: keystoreState } = useControllerState({
    id: 'KeystoreController',
    subscriptionEnabled: true
  })

  const { navigate } = useNavigation()
  const { path } = useRoute()

  // Modalize hook for the requests bottom sheet
  const { ref: requestModalRef, open: openRequestModal, close: closeRequestModal } = useModalize()

  // Timeout ref for the 1000ms delay matching extension behavior
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  // Track if bottom sheet is currently open
  const isBottomSheetOpenRef = useRef(false)

  const currentUserRequestRef = useRef(requestsState?.currentUserRequest)
  currentUserRequestRef.current = requestsState?.currentUserRequest

  const pathRef = useRef(path)
  pathRef.current = path

  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  const onBottomSheetClosed = useMemo(
    () => () => {
      isBottomSheetOpenRef.current = false
      if (currentUserRequestRef.current?.kind === 'unlock') {
        return
      }
      dispatch({ type: 'WINDOW_REMOVED', params: { id: 1 } })
    },
    [dispatch]
  )

  useEffect(() => {
    const handleWindowAction = (payload: { type: string; winId: number }) => {
      if (payload.type === 'open' || payload.type === 'focus') {
        if (currentUserRequestRef.current?.kind === 'unlock') {
          if (isBottomSheetOpenRef.current) {
            closeRequestModal()
          }
          const pathname = pathRef.current?.substring(1)
          if (pathname !== ROUTES.keyStoreUnlock) {
            navigateRef.current(ROUTES.keyStoreUnlock)
          }
          return
        }

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
  }, [openRequestModal, closeRequestModal, requestsState?.currentUserRequest])

  useEffect(() => {
    if (requestsState?.currentUserRequest?.kind === 'unlock') {
      if (isBottomSheetOpenRef.current) {
        closeRequestModal()
      }
      const pathname = pathRef.current?.substring(1)
      if (pathname !== ROUTES.keyStoreUnlock) {
        navigateRef.current(ROUTES.keyStoreUnlock)
      }
    } else if (requestsState?.currentUserRequest && keystoreState?.isUnlocked) {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      if (!isBottomSheetOpenRef.current) {
        openRequestModal()
        isBottomSheetOpenRef.current = true
      }
    }
  }, [requestsState?.currentUserRequest, keystoreState?.isUnlocked, closeRequestModal, openRequestModal])

  useEffect(() => {
    if (keystoreState?.isUnlocked && requestsState?.currentUserRequest?.kind === 'unlock') {
      dispatch({
        type: 'method',
        params: {
          ctrlName: 'RequestsController',
          method: 'resolveUserRequest',
          args: [null, requestsState.currentUserRequest.id]
        }
      })

      const pendingRequest = requestsState.visibleUserRequests?.find((r) => r.kind !== 'unlock')
      if (pendingRequest) {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current)
          closeTimeoutRef.current = null
        }
        if (!isBottomSheetOpenRef.current) {
          openRequestModal()
          isBottomSheetOpenRef.current = true
        }
      }
    }
  }, [
    keystoreState?.isUnlocked,
    requestsState?.currentUserRequest,
    requestsState?.visibleUserRequests,
    dispatch,
    openRequestModal
  ])

  // Backup to close bottom sheet after 1000ms if shouldOpenBottomSheet
  // is false. This is a safety net that should rarely trigger since window events
  // handle the normal flow. It ensures the sheet eventually closes if state gets
  // out of sync.
  useEffect(() => {
    if (isBottomSheetOpenRef.current) {
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
  }, [closeRequestModal])

  // Update helpers so they are available via useController('RequestsController')
  useEffect(() => {
    updateHelpers({
      requestModalRef,
      openRequestModal,
      closeRequestModal,
      onBottomSheetClosed
    })
  }, [updateHelpers, requestModalRef, openRequestModal, closeRequestModal, onBottomSheetClosed])
}
