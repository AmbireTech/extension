import React, { ReactNode, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-native'

import { useTranslation } from '@common/config/localization'
import { useIsScreenFocused } from '@common/contexts/screenFocusContext'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectSelectedType = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.selectedType

/**
 * Guards the screens that need the selected account's address (its portfolio, sending, apps),
 * sending a selected private account, which has none, to its dashboard with a toast saying
 * why. Also catches deep links and restored routes, as their entry points are hidden.
 */
const RegularAccountRoute = ({ children }: { children?: ReactNode }) => {
  const { state: selectedType } = useController('SelectedAccountController', selectSelectedType)
  const isFocused = useIsScreenFocused()
  const { addToast } = useToast()
  const { t } = useTranslation()
  const isPrivateAccount = !!selectedType && selectedType !== 'regular'
  // Only the focused screen redirects, as in `AuthenticatedRoute`
  const shouldRedirect = isPrivateAccount && isFocused

  useEffect(() => {
    if (!shouldRedirect) return

    addToast(t('Not available for private accounts.'), { type: 'info' })
  }, [shouldRedirect, addToast, t])

  if (!isPrivateAccount) return children || <Outlet />

  if (!shouldRedirect) return null

  return <Navigate to={ROUTES.dashboard} replace />
}

export default RegularAccountRoute
