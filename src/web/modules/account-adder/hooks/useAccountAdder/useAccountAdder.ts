import React, { useCallback, useEffect } from 'react'

import { KeyIterator } from '@ambire-common/interfaces/keyIterator'
import useNavigation from '@common/hooks/useNavigation'
import { STEPPER_FLOWS } from '@common/modules/auth/contexts/stepperContext/stepperContext'
import useStepper from '@common/modules/auth/hooks/useStepper'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import useAccountAdderControllerState from '@web/hooks/useAccountAdderControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useMainControllerState from '@web/hooks/useMainControllerState'
import useTaskQueue from '@web/modules/hardware-wallet/hooks/useTaskQueue'

interface Props {
  keyType?: KeyIterator['type']
  keySubType: KeyIterator['subType']
}

const useAccountAdder = ({ keyType, keySubType }: Props) => {
  const { goBack } = useNavigation()
  const { navigate } = useNavigation()
  const { updateStepperState } = useStepper()
  const { createTask } = useTaskQueue()
  const { dispatch } = useBackgroundService()
  const accountAdderState = useAccountAdderControllerState()
  const mainControllerState = useMainControllerState()

  useEffect(() => {
    return () => dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_RESET_IF_NEEDED' })
  }, [dispatch])

  useEffect(() => {
    if (!accountAdderState.isInitialized) goBack()
  }, [accountAdderState.isInitialized, goBack])

  const setPage = React.useCallback(
    (page = 1) => {
      createTask(() =>
        dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_SET_PAGE', params: { page } })
      )
    },
    [dispatch, createTask]
  )

  useEffect(() => {
    const step: keyof typeof STEPPER_FLOWS = keySubType || 'hw'

    updateStepperState(WEB_ROUTES.accountAdder, step)
  }, [keySubType, updateStepperState])

  const completeStep = useCallback(
    (hasAccountsToImport: boolean = true) => {
      hasAccountsToImport
        ? navigate(hasAccountsToImport ? WEB_ROUTES.accountPersonalize : '/', {
            state: { accounts: accountAdderState.readyToAddAccounts }
          })
        : navigate('/', { state: { openOnboardingCompleted: true } })
    },
    [navigate, accountAdderState]
  )

  useEffect(() => {
    if (
      mainControllerState.status === 'SUCCESS' &&
      mainControllerState.latestMethodCall === 'onAccountAdderSuccess'
    ) {
      completeStep()
    }
  }, [completeStep, mainControllerState.status, mainControllerState.latestMethodCall])

  const onImportReady = useCallback(() => {
    if (!accountAdderState.selectedAccounts.length) return completeStep(false)

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    dispatch({ type: 'MAIN_CONTROLLER_ACCOUNT_ADDER_ADD_ACCOUNTS' })
  }, [accountAdderState.selectedAccounts, completeStep, dispatch])

  return { setPage, onImportReady }
}

export default useAccountAdder
