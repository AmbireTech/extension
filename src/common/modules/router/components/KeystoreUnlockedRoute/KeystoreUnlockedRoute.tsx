import React, { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-native'

import useController from '@common/hooks/useController'
import { ROUTES } from '@common/modules/router/constants/common'

const KeystoreUnlockedRoute = ({ children }: { children?: ReactNode }) => {
  const keystoreState = useController('KeystoreController').state
  const shouldNavigateToUnlock = keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked

  return shouldNavigateToUnlock ? <Navigate to={ROUTES.keyStoreUnlock} /> : children || <Outlet />
}

export default KeystoreUnlockedRoute
