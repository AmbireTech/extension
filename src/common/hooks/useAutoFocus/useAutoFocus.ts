import { useCallback, useEffect, useRef } from 'react'
import { TextInput } from 'react-native'

import { isWeb } from '@common/config/env'
import { useIsScreenSettled } from '@common/contexts/screenFocusContext'

/**
 * Holds a field's initial focus back until the platform has finished transitioning to
 * its screen, so the keyboard is not animated up while the navigation still is. Focuses
 * once, the way `autoFocus` does - a screen the user comes back to is left as it was.
 *
 * Web keeps the native `autoFocus`: there is no transition there to wait for.
 */
const useAutoFocus = (autoFocus?: boolean, setInputRef?: (ref: TextInput | null) => void) => {
  const isScreenSettled = useIsScreenSettled()
  const inputRef = useRef<TextInput | null>(null)
  const hasAutoFocusedRef = useRef(false)
  const shouldDeferAutoFocus = !isWeb && !!autoFocus

  const setRef = useCallback(
    (ref: TextInput | null) => {
      inputRef.current = ref
      setInputRef?.(ref)
    },
    [setInputRef]
  )

  useEffect(() => {
    if (!shouldDeferAutoFocus || !isScreenSettled || hasAutoFocusedRef.current) return

    hasAutoFocusedRef.current = true
    inputRef.current?.focus()
  }, [shouldDeferAutoFocus, isScreenSettled])

  return { autoFocus: shouldDeferAutoFocus ? false : autoFocus, setInputRef: setRef }
}

export default useAutoFocus
