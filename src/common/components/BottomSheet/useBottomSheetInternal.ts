import { nanoid } from 'nanoid'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { isWeb } from '@common/config/env'
import useCompactLayout from '@common/hooks/useCompactLayout'
import usePrevious from '@common/hooks/usePrevious'
import { HEADER_HEIGHT } from '@common/modules/header/components/Header/Header'
import { SPACING_SM } from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

import { BottomSheetProps } from './types'
import { bottomSheetCloseEventStream, openBottomSheetsCount } from './bottomSheetEventStream'
import type { SheetRef } from './useSheetRef'

const { isPopup, isMobileApp } = getUiType()

const useBottomSheetInternal = (props: BottomSheetProps) => {
  const {
    id: _id,
    type: _type,
    sheetRef,
    autoOpen = false,
    modalTopOffset: customModalTopOffset
  } = props
  const { closeBottomSheet: _closeBottomSheet = () => {} } = props
  const closeBottomSheet = useCallback(_closeBottomSheet, [_closeBottomSheet])
  const { isNarrowWebLayout } = useCompactLayout()
  const defaultType = isPopup || isMobileApp || isNarrowWebLayout ? 'bottom-sheet' : 'modal'
  const resolvedType = _type || defaultType
  const type = (() => {
    if (isNarrowWebLayout && resolvedType === 'modal') return 'bottom-sheet'

    return resolvedType
  })()
  const isModal = type === 'modal'
  const [isOpen, setIsOpen] = useState(false)
  const prevIsOpen = usePrevious(isOpen)
  const [openCountAtOpenTime, setOpenCountAtOpenTime] = useState(0)
  const { top } = useSafeAreaInsets()

  // Ensures ID is unique per component to avoid duplicates when multiple bottom sheets are rendered
  const id = useMemo(() => `${_id || 'bottom-sheet'}-${nanoid(6)}`, [_id])

  const autoOpened: React.MutableRefObject<boolean> = useRef(false)
  const setRef = useCallback(
    (handle: SheetRef | null) => {
      sheetRef.current = handle
      // check if component is mounted and if should autoOpen
      if (autoOpen && sheetRef.current && !autoOpened.current) {
        sheetRef.current.open()
        autoOpened.current = !autoOpened.current // ensure that the bottom sheet auto-opens only once
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [autoOpen]
  )

  const isOpenRef = useRef(isOpen)

  useEffect(() => {
    isOpenRef.current = isOpen
    if (isOpen && !prevIsOpen) {
      setOpenCountAtOpenTime(openBottomSheetsCount.value + 1)
      openBottomSheetsCount.next(openBottomSheetsCount.value + 1)
    } else if (!isOpen && prevIsOpen) {
      openBottomSheetsCount.next(Math.max(0, openBottomSheetsCount.value - 1))
    }
  }, [id, isOpen, prevIsOpen])

  // Cleanup: ensure count is decremented if unmounted while open
  useEffect(() => {
    return () => {
      if (isOpenRef.current) {
        openBottomSheetsCount.next(Math.max(0, openBottomSheetsCount.value - 1))
      }
    }
  }, [id])

  // Hook up the back button (or action) to close the bottom sheet
  useEffect(() => {
    if (!isOpen) return

    // Subscribe to the global close event stream
    const subscription = bottomSheetCloseEventStream.subscribe(() => {
      if (isOpen) {
        closeBottomSheet()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [closeBottomSheet, isOpen])

  const modalTopOffset = useMemo(() => {
    if (customModalTopOffset !== undefined) return customModalTopOffset
    if (isPopup && isModal) return 0
    if (isNarrowWebLayout) return 0
    if (isWeb) return HEADER_HEIGHT - 20

    const topOffset = top - SPACING_SM

    return topOffset
  }, [customModalTopOffset, isModal, isNarrowWebLayout, top])

  return {
    modalTopOffset,
    setRef,
    type,
    isModal,
    isOpen,
    setIsOpen,
    id,
    /** Opened while another sheet was up, so it was opened from that one. */
    isNested: openCountAtOpenTime > 1
  }
}

export default useBottomSheetInternal
