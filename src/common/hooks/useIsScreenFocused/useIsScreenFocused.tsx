import { useEffect, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'

const useIsScreenFocused = () => {
  const [isFocused, setIsFocused] = useState<boolean>(AppState.currentState === 'active')

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setIsFocused(nextAppState === 'active')
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.remove()
    }
  }, [])

  return isFocused
}

export default useIsScreenFocused
