import { useEffect, useRef, useState } from 'react'

import { isWeb } from '@common/config/env'

// RN < 0.85 chains every native TextInput state to the previous one, once per value change the
// app makes. Freeing a chain a few hundred long overflows the Hermes GC thread's stack and the
// app closes without an error, so the input is remounted well before that.
const VALUE_CHANGES_BEFORE_REMOUNT = 50

/**
 * A `key` for a native `TextInput` that changes after every 50 changes of its `value`, so a new
 * input (with a fresh state chain) replaces it - e.g. while a slider rewrites an amount field
 * dozens of times a second. It only changes while the input is not focused, so the keyboard,
 * the caret and the selection are never lost. Always 0 on the web, which is not affected.
 */
const useTextInputRemountKey = (value: string | undefined, isFocused: boolean) => {
  const [remountKey, setRemountKey] = useState(0)
  const valueChangeCountRef = useRef(0)
  const previousValueRef = useRef(value)

  useEffect(() => {
    if (isWeb) return

    if (value !== previousValueRef.current) {
      previousValueRef.current = value
      valueChangeCountRef.current += 1
    }
    if (isFocused || valueChangeCountRef.current < VALUE_CHANGES_BEFORE_REMOUNT) return

    valueChangeCountRef.current = 0
    setRemountKey((key) => key + 1)
  }, [value, isFocused])

  return remountKey
}

export default useTextInputRemountKey
