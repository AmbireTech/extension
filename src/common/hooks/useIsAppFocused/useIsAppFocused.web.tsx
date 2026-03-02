import { useEffect, useState } from 'react'

const useIsAppFocused = () => {
  const [isFocused, setIsFocused] = useState(true)

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsFocused(!document.hidden)
    }

    const handleWindowFocus = () => {
      setIsFocused(true)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])

  return isFocused
}

export default useIsAppFocused
