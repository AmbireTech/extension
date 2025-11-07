import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import ErrorPage from '@legends/components/ErrorPage'
import Spinner from '@legends/components/Spinner'
import useAccountContext from '@legends/hooks/useAccountContext'
import useCharacterContext from '@legends/hooks/useCharacterContext'
import { LEGENDS_ROUTES } from '@legends/modules/router/constants'

const PrivateRoute = () => {
  const { connectedAccount, v1Account, isLoading } = useAccountContext()
  const { character, error: characterError, isLoading: isCharacterLoading } = useCharacterContext()

  const { pathname } = useLocation()

  const isConnectedAccountV2 = !!connectedAccount && !v1Account

  if (isConnectedAccountV2 && (isLoading || (!character && isCharacterLoading)))
    return <Spinner isCentered />

  if (characterError) return <ErrorPage title="Character loading error" error={characterError} />

  if (pathname === LEGENDS_ROUTES.characterSelect && !!v1Account) {
    return <Navigate to={LEGENDS_ROUTES.home} />
  }

  return <Outlet />
}

export default PrivateRoute
