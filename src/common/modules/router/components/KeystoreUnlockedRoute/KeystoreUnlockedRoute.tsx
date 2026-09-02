import React, { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-native'

import { useIsScreenFocused } from '@common/contexts/screenFocusContext'
import useController from '@common/hooks/useController'
import { ROUTES } from '@common/modules/router/constants/common'

const KeystoreUnlockedRoute = ({ children }: { children?: ReactNode }) => {
  const keystoreState = useController('KeystoreController').state
  const isFocused = useIsScreenFocused()
  const shouldNavigateToUnlock = keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked

  if (!shouldNavigateToUnlock) return children || <Outlet />

  // The mobile stack keeps previous screens mounted, and each of them renders
  // this guard - only the focused one redirects, or locking the wallet would fire
  // a navigation per mounted screen. The rest render nothing, so no screen that
  // needs an unlocked keystore stays on display behind it.
  if (!isFocused) return null

  return <Navigate to={ROUTES.keyStoreUnlock} />
}

export default KeystoreUnlockedRoute
