import React, { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-native'

import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES } from '@common/modules/router/constants/common'

const AuthenticatedRoute = ({ children }: { children?: ReactNode }) => {
  const { authStatus } = useAuth()

  if (authStatus === AUTH_STATUS.LOADING) return null

  const shouldNavigateToGetStarted = authStatus !== AUTH_STATUS.AUTHENTICATED

  return shouldNavigateToGetStarted ? <Navigate to={ROUTES.getStarted} /> : children || <Outlet />
}

export default AuthenticatedRoute
