import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { ROUTES } from '@common/modules/router/constants/common'
import { INVITE_STATUS } from '@web/extension-services/background/controllers/invite'
import useInviteControllerState from '@web/hooks/useInviteControllerState/useInviteControllerState'

const InviteConfirmedRoute = () => {
  const { inviteStatus } = useInviteControllerState()

  // TODO: Figure out if this is needed, maybe while the inviteStatus is not determined yet?
  // returns empty fragment because React Router complains
  // when the children of <Routes> are different from <Route /> and <Fragment />
  // eslint-disable-next-line react/jsx-no-useless-fragment
  // if (inviteStatus === INVITE_STATUS.UNCHECKED) return <></>

  if (inviteStatus === INVITE_STATUS.VERIFIED) return <Outlet />

  return <Navigate to={ROUTES.inviteVerify} />
}

export default InviteConfirmedRoute
