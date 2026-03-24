import { nanoid } from 'nanoid'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { isWeb } from '@common/config/env'
import usePrevious from '@common/hooks/usePrevious'
import { HEADER_HEIGHT } from '@common/modules/header/components/Header/Header'
import { SPACING_SM } from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

import { BottomSheetProps } from './BottomSheet'
import { bottomSheetCloseEventStream, openBottomSheetsCount } from './bottomSheetEventStream'

const ANIMATION_DURATION: number = 250

const { isPopup, isMobileApp } = getUiType()

const useBottomSheetInternal = (props: BottomSheetProps) => {
  const { id: _id, type: _type, sheetRef, autoOpen = false } = props
  const { closeBottomSheet: _closeBottomSheet = () => {} } = props
  const closeBottomSheet = useCallback(_closeBottomSheet, [_closeBottomSheet])
  const type = _type || (isPopup || isMobileApp ? 'bottom-sheet' : 'modal')
  const isModal = type === 'modal'
  const [isOpen, setIsOpen] = useState(false)
  const prevIsOpen = usePrevious(isOpen)
  const [isBackdropVisible, setIsBackdropVisible] = useState(false)
  const { top } = useSafeAreaInsets()

  // Ensures ID is unique per component to avoid duplicates when multiple bottom sheets are rendered
  const id = useMemo(() => `${_id || 'bottom-sheet'}-${nanoid(6)}`, [_id])

  const autoOpened: React.MutableRefObject<boolean> = useRef(false)
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      // @ts-ignore
      // eslint-disable-next-line no-param-reassign
      sheetRef.current = node
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
    if (prevIsOpen && !isOpen) {
      setTimeout(() => {
        // Delays the backdrop unmounting because of the closing animation duration
        setIsBackdropVisible(false)
      }, ANIMATION_DURATION)
    }

    if (isOpen && !prevIsOpen) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (isPopup && isModal) return 0
    if (isWeb) return HEADER_HEIGHT - 20

    return top + SPACING_SM
  }, [isModal, top])

  return {
    modalTopOffset,
    setRef,
    type,
    isModal,
    isOpen,
    setIsOpen,
    isBackdropVisible,
    setIsBackdropVisible,
    id
  }
}

export default useBottomSheetInternal
