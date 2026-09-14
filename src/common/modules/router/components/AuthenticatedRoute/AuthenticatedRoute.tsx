import React, { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-native'

import { useIsScreenFocused } from '@common/contexts/screenFocusContext'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES } from '@common/modules/router/constants/common'
import { getUiType } from '@common/utils/uiType'

const { isSidePanel } = getUiType()

const AuthenticatedRoute = ({ children }: { children?: ReactNode }) => {
  const { authStatus } = useAuth()
  const isFocused = useIsScreenFocused()

  if (authStatus === AUTH_STATUS.LOADING) return null

  const shouldNavigateToGetStarted = authStatus !== AUTH_STATUS.AUTHENTICATED

  if (shouldNavigateToGetStarted) {
    // The mobile stack keeps previous screens mounted, and each of them renders
    // this guard - only the focused one is allowed to redirect, or one sign out
    // would fire a navigation per mounted screen.
    if (!isFocused) return null

    // Full onboarding is tab-only; side panel uses a dedicated empty-state page instead.
    return <Navigate to={isSidePanel ? ROUTES.sidePanelNoAccounts : ROUTES.getStarted} replace />
  }

  return children || <Outlet />
}

export default AuthenticatedRoute
