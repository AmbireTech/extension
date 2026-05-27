import { useEffect, useMemo, useRef } from 'react'
import { useModalize } from 'react-native-modalize'

import useControllerState from '@common/hooks/useControllerState'
import eventBus from '@common/services/event/eventBus'
import { Action, MethodAction } from '@common/types/actions'

export default function useRequestsControllerHelpers(
  dispatch: (action: Action | MethodAction) => void
) {
  const { updateHelpers } = useControllerState({
    id: 'RequestsController',
    subscriptionEnabled: true
  })

  // Modalize hook for the requests bottom sheet
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

  useEffect(() => {
    const handleWindowAction = (payload: { type: string; winId: number }) => {
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
  }, [openRequestModal, closeRequestModal])

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
