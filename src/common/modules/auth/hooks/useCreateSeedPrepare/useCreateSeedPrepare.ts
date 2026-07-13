import { useCallback, useEffect, useState } from 'react'

import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

const CHECKBOXES = [
  {
    id: 0,
    label: 'Your recovery phrase is private. Keep it safe and never share it.'
  },
  {
    id: 1,
    label: 'If your recovery phrase is at risk, so is your account.'
  },
  {
    id: 2,
    label: 'Use your recovery phrase only to access or recover your wallet.'
  }
]

export default function useCreateSeedPrepare() {
  const { goToNextRoute } = useOnboardingNavigation()

  const [checkboxesState, setCheckboxesState] = useState([false, false, false])
  const allCheckboxesChecked = checkboxesState.every((checkbox) => checkbox)

  const { dispatch: keystoreDispatch } = useController('KeystoreController')

  const { getExtraEntropy } = useExtraEntropy()

  useEffect(() => {
    keystoreDispatch({
      type: 'method',
      params: {
        method: 'sendTempSeedToUi',
        args: []
      }
    })
  }, [keystoreDispatch])

  const handleSubmit = useCallback(() => {
    keystoreDispatch({
      type: 'method',
      params: {
        method: 'generateTempSeed',
        args: [{ extraEntropy: getExtraEntropy() }]
      }
    })

    goToNextRoute(WEB_ROUTES.createSeedPhraseWrite)
  }, [getExtraEntropy, goToNextRoute, keystoreDispatch])

  const handleCheckboxPress = (id: number) => {
    setCheckboxesState((prevState) => {
      const newState = [...prevState]
      newState[id] = !prevState[id]
      return newState
    })
  }

  return {
    handleSubmit,
    handleCheckboxPress,
    checkboxesState,
    allCheckboxesChecked,
    CHECKBOXES
  }
}
