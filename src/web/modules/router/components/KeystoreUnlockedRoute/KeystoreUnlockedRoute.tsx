import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import useController from '@common/hooks/useController'
import { ROUTES } from '@common/modules/router/constants/common'

const KeystoreUnlockedRoute = () => {
  const keystoreState = useController('KeystoreController').state
  const shouldNavigateToUnlock = keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked

  return shouldNavigateToUnlock ? <Navigate to={ROUTES.keyStoreUnlock} /> : <Outlet />
}

export default KeystoreUnlockedRoute
