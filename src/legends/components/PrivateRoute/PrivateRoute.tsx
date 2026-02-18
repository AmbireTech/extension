import React from 'react'
import { Outlet } from 'react-router-dom'

import Spinner from '@legends/components/Spinner'
import useAccountContext from '@legends/hooks/useAccountContext'

const PrivateRoute = () => {
  const { connectedAccount, v1Account, isLoading } = useAccountContext()

  const isConnectedAccountV2 = !!connectedAccount && !v1Account

  if (isConnectedAccountV2 && isLoading) return <Spinner isCentered />

  return <Outlet />
}

export default PrivateRoute
