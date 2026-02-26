import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import { ROUTES } from '@common/modules/router/constants/common'

const getInitialRoute = ({
  keystoreState,
  authStatus
}: {
  keystoreState: IKeystoreController
  authStatus: AUTH_STATUS
}) => {
  if (keystoreState.isReadyToStoreKeys && !keystoreState.isUnlocked) {
    return ROUTES.keyStoreUnlock
  }

  if (authStatus === AUTH_STATUS.NOT_AUTHENTICATED) {
    return ROUTES.getStarted
  }

  return ROUTES.dashboard
}

export { getInitialRoute }
