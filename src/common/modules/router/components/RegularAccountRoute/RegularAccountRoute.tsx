import React, { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-native'

import useController from '@common/hooks/useController'
import { useIsScreenFocused } from '@common/contexts/screenFocusContext'
import { ROUTES } from '@common/modules/router/constants/common'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectPrivateAccountSeedId = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.privateAccount?.seedId ?? null

/**
 * Guards the screens that need the selected account's address (its portfolio, sending, apps),
 * sending a selected Privacy Pools account, which has none, to its dashboard instead.
 */
const RegularAccountRoute = ({ children }: { children?: ReactNode }) => {
  const { state: privateAccountSeedId } = useController(
    'SelectedAccountController',
    selectPrivateAccountSeedId
  )
  const isFocused = useIsScreenFocused()

  if (!privateAccountSeedId) return children || <Outlet />

  // Only the focused screen redirects, as in `AuthenticatedRoute`
  if (!isFocused) return null

  return <Navigate to={ROUTES.dashboard} replace />
}

export default RegularAccountRoute
