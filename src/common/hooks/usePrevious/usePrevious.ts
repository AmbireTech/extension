import { useEffect, useRef } from 'react'

function usePrevious<T>(value: any): T | undefined {
  // The ref object is a generic container whose current property is mutable ...
  // ... and can hold any value, similar to an instance property on a class
  const ref = useRef<T | undefined>(undefined)
  // Store current value in ref
  useEffect(() => {
    ref.current = value as T
  }, [value]) // Only re-run if value changes
  // Return previous value (happens before update in useEffect above)
  return ref?.current
}

export default usePrevious
