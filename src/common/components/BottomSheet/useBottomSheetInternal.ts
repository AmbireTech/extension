import { nanoid } from 'nanoid'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BackHandler } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { isWeb } from '@common/config/env'
import usePrevious from '@common/hooks/usePrevious'
import { HEADER_HEIGHT } from '@common/modules/header/components/Header/Header'
import { SPACING_SM } from '@common/styles/spacings'
import { getUiType } from '@common/utils/uiType'

import { BottomSheetProps } from './types'

const ANIMATION_DURATION: number = 250

const { isPopup, isMobileApp } = getUiType()

const useBottomSheetInternal = (props: BottomSheetProps) => {
  const { id: _id, type: _type, sheetRef, closeBottomSheet = () => {}, autoOpen = false } = props
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

  useEffect(() => {
    if (prevIsOpen && !isOpen) {
      setTimeout(() => {
        // Delays the backdrop unmounting because of the closing animation duration
        setIsBackdropVisible(false)
      }, ANIMATION_DURATION)
    }
  }, [isOpen, prevIsOpen])

  // Hook up the back button (or action) to close the bottom sheet
  useEffect(() => {
    if (!isOpen) return

    const backAction = () => {
      if (isOpen) {
        closeBottomSheet()
        // Returning true prevents execution of the default native back handling
        return true
      }

      return false
    }

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction)

    return () => backHandler.remove()
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
