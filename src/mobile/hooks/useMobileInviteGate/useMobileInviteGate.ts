import { useEffect } from 'react'

import { INVITE_STATUS } from '@ambire-common/controllers/invite/invite'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import { hasLegacyAccounts } from '@mobile/services/legacyMigration/legacyMigration'

// Real invite codes, recorded for the users who were already on the app before the gate got
// introduced, so that their verified code is never blank. Two of them, to keep the two groups
// apart in the invite stats. Fine to be public - the invite gate was never meant to be strongly
// protective, so it's no problem if someone finds these.
const V1_MIGRATED_USER_CODE = '0dd2c698578f'
const EXISTING_V2_USER_CODE = 'b1d2c702fb5d'

const selectInviteStatus = (state: AllControllersMappingType['InviteController']) =>
  state.inviteStatus

const selectIsReadyToStoreKeys = (state: AllControllersMappingType['KeystoreController']) =>
  state.isReadyToStoreKeys

/**
 * The mobile app is invite-only, but only for fresh installs. Tells whether the
 * invite gate must be enforced and auto-grants access to everyone who was
 * already using the app, so that an app update never locks them out.
 */
const useMobileInviteGate = () => {
  const { state: inviteStatus, dispatch } = useController('InviteController', selectInviteStatus)
  const { state: isReadyToStoreKeys } = useController(
    'KeystoreController',
    selectIsReadyToStoreKeys
  )

  // Users updating from the legacy v1 app have an empty keystore (their v1 data lives in a
  // separate storage), hence the check on the legacy storage rather than on the keystore.
  const isV1MigratedUser = hasLegacyAccounts()
  const isExistingUser = isV1MigratedUser || isReadyToStoreKeys
  const isVerified = inviteStatus === INVITE_STATUS.VERIFIED

  useEffect(() => {
    if (!isExistingUser || isVerified) return

    dispatch({
      type: 'method',
      params: {
        method: 'grantAccess',
        args: [isV1MigratedUser ? V1_MIGRATED_USER_CODE : EXISTING_V2_USER_CODE]
      }
    })
  }, [isExistingUser, isV1MigratedUser, isVerified, dispatch])

  return { isGateEnforced: !isVerified && !isExistingUser }
}

export default useMobileInviteGate
