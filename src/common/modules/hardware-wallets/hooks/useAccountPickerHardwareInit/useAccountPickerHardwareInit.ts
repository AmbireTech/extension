import { useCallback } from 'react'

import { waitForReply } from '@common/hooks/useController/waitForReply'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { Action } from '@common/types/actions'

type HardwareInitAction = Extract<
  Action,
  {
    type:
      | 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LEDGER'
      | 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_TREZOR'
      | 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_ONEKEY'
      | 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_LATTICE'
      | 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_QR_WALLET'
      | 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_NFC_WALLET'
  }
>

// Setting up can wait on the user - unlocking the device, approving in Trezor Suite or
// Trezor Connect - so it gets far more room than a plain controller call
const HARDWARE_INIT_TIMEOUT_MS = 5 * 60 * 1000

/**
 * Sets the account picker up for a hardware wallet and moves on to the picker once the
 * controller replies (to the password step first, when there is no password yet). Rejects
 * when setting up fails - the controller reports why, so the screen only has to let the
 * user try again.
 */
export default function useAccountPickerHardwareInit() {
  const { dispatch } = useControllersMiddleware()
  const { goToNextRoute } = useOnboardingNavigation()

  return useCallback(
    async (action: HardwareInitAction) => {
      await waitForReply(action.type, HARDWARE_INIT_TIMEOUT_MS, (requestId) =>
        dispatch({ ...action, params: { ...action.params, requestId } } as HardwareInitAction)
      )
      goToNextRoute(WEB_ROUTES.accountPicker)
    },
    [dispatch, goToNextRoute]
  )
}
