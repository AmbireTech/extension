import React, { createContext, useContext } from 'react'

// True by default: the extension and the standalone websites render one route at
// a time, so whatever is mounted there is always the focused screen.
const ScreenFocusContext = createContext(true)

/**
 * Marks its subtree as the screen the user is on. The mobile navigation stack
 * keeps the screens below the top one mounted, so anything that must only run
 * while its screen is actually visible - a camera, a redirect, a poll - has to
 * ask instead of assuming that being mounted is enough.
 */
const ScreenFocusProvider = ({
  isFocused,
  children
}: {
  isFocused: boolean
  children: React.ReactNode
}) => <ScreenFocusContext.Provider value={isFocused}>{children}</ScreenFocusContext.Provider>

const useIsScreenFocused = () => useContext(ScreenFocusContext)

export { ScreenFocusProvider, useIsScreenFocused }
