import { useCallback, useEffect, useRef, useState } from 'react'
import { TextInput } from 'react-native'

import {
  useIsBottomSheetOpen,
  useIsInsideBottomSheet
} from '@common/components/BottomSheet/BottomSheetContext'
import { isWeb } from '@common/config/env'
import { useIsScreenSettled } from '@common/contexts/screenFocusContext'

/**
 * Holds a field's initial focus back until the platform has finished transitioning to
 * its screen, so the keyboard is not animated up while the navigation still is. Focuses
 * once, the way `autoFocus` does - a screen the user comes back to is left as it was.
 *
 * A field in a bottom sheet also waits for the sheet to open: native sheets mount their
 * content before they are presented, and opening one dismisses the keyboard. It focuses
 * again every time the sheet opens, like the fields of the old sheets that remounted.
 *
 * Web keeps the native `autoFocus`: there is no transition there to wait for. Neither does
 * a field that mounts focused on a settled screen or in an open sheet, which keeps it too.
 */
const useAutoFocus = (autoFocus?: boolean, setInputRef?: (ref: TextInput | null) => void) => {
  const isScreenSettled = useIsScreenSettled()
  const isInsideBottomSheet = useIsInsideBottomSheet()
  const isBottomSheetOpen = useIsBottomSheetOpen()
  const isReadyToFocus = isScreenSettled && (!isInsideBottomSheet || isBottomSheetOpen)
  const inputRef = useRef<TextInput | null>(null)
  const hasAutoFocusedRef = useRef(false)
  // A `focus()` from the mount effect reaches Android before the view is attached, so the
  // keyboard is refused; the native `autoFocus` waits for the attach
  const [canAutoFocusNatively] = useState(() => isReadyToFocus && !!autoFocus)
  const shouldDeferAutoFocus = !isWeb && !!autoFocus && !canAutoFocusNatively

  const setRef = useCallback(
    (ref: TextInput | null) => {
      inputRef.current = ref
      setInputRef?.(ref)
    },
    [setInputRef]
  )

  useEffect(() => {
    if (isInsideBottomSheet && !isBottomSheetOpen) {
      hasAutoFocusedRef.current = false
      return
    }
    if (!shouldDeferAutoFocus || !isReadyToFocus || hasAutoFocusedRef.current) return

    hasAutoFocusedRef.current = true
    inputRef.current?.focus()
  }, [shouldDeferAutoFocus, isReadyToFocus, isInsideBottomSheet, isBottomSheetOpen])

  return { autoFocus: shouldDeferAutoFocus ? false : autoFocus, setInputRef: setRef }
}

export default useAutoFocus
