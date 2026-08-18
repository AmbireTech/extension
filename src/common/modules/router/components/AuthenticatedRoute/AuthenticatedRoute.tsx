import React, { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-native'

import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES } from '@common/modules/router/constants/common'
import { getUiType } from '@common/utils/uiType'

const { isSidePanel } = getUiType()

const AuthenticatedRoute = ({ children }: { children?: ReactNode }) => {
  const { authStatus } = useAuth()

  if (authStatus === AUTH_STATUS.LOADING) return null

  const shouldNavigateToGetStarted = authStatus !== AUTH_STATUS.AUTHENTICATED

  if (shouldNavigateToGetStarted) {
    // Full onboarding is tab-only; side panel uses a dedicated empty-state page instead.
    return <Navigate to={isSidePanel ? ROUTES.sidePanelNoAccounts : ROUTES.getStarted} replace />
  }

  return children || <Outlet />
}

export default AuthenticatedRoute
