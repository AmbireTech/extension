import React, { createContext, useEffect, useMemo, useState } from 'react'
import { Keyboard, KeyboardEventListener } from 'react-native'

export interface KeyboardContextReturnType {
  keyboardShown: boolean
  keyboardHeight: number
}

const KeyboardContext = createContext<KeyboardContextReturnType>({
  keyboardShown: false,
  keyboardHeight: 0
})

const KeyboardProvider = ({ children }: { children: React.ReactNode }) => {
  const [shown, setShown] = useState(false)

  const [keyboardHeight, setKeyboardHeight] = useState<number>(0)

  const handleKeyboardDidShow: KeyboardEventListener = (e) => {
    setShown(true)
    setKeyboardHeight(e.endCoordinates.height)
  }

  const handleKeyboardDidHide: KeyboardEventListener = () => {
    setShown(false)
    setKeyboardHeight(0)
  }

  useEffect(() => {
    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow),
      Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide)
    ]

    return () => {
      subscriptions.forEach((subscription) => subscription.remove())
    }
  }, [])

  return (
    <KeyboardContext.Provider
      value={useMemo(
        () => ({
          keyboardShown: shown,
          keyboardHeight
        }),
        [shown, keyboardHeight]
      )}
    >
      {children}
    </KeyboardContext.Provider>
  )
}

export { KeyboardContext, KeyboardProvider }
