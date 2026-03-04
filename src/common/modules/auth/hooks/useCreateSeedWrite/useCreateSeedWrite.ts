import { useCallback, useEffect, useMemo, useState } from 'react'

import { KeystoreSeed } from '@ambire-common/interfaces/keystore'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useIsRouteActive from '@common/hooks/useIsRouteActive'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import eventBus from '@common/services/event/eventBus'
import { setStringAsync } from '@common/utils/clipboard'

export default function useCreateSeedWrite() {
  const isFocused = useIsRouteActive(ROUTES.createSeedPhraseWrite)
  const { goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const {
    state: { hasTempSeed },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')
  const { dispatch: mainDispatch } = useController('MainController')
  const [tempSeed, setTempSeed] = useState<KeystoreSeed | null>(null)
  const { initParams, subType } = useController('AccountPickerController').state
  const [submitButtonPressed, setSubmitButtonPressed] = useState(false)

  useEffect(() => {
    if (isFocused && !tempSeed && hasTempSeed) {
      keystoreDispatch({
        type: 'method',
        params: {
          method: 'sendTempSeedToUi',
          args: []
        }
      })
    }
  }, [keystoreDispatch, isFocused, tempSeed, hasTempSeed])

  useEffect(() => {
    const onReceiveOneTimeData = (data: any) => {
      if (!data.tempSeed) return

      setTempSeed(data.tempSeed)
    }

    eventBus.addEventListener('receiveOneTimeData', onReceiveOneTimeData)

    return () => eventBus.removeEventListener('receiveOneTimeData', onReceiveOneTimeData)
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!tempSeed) return

    setSubmitButtonPressed(true)
    mainDispatch({
      type: 'method',
      params: {
        method: 'accountPickerSetInitParamsFromPrivateKeyOrSeedPhrase',
        args: [{ privKeyOrSeed: tempSeed.seed, seedPassphrase: tempSeed.seedPassphrase }]
      }
    })
  }, [mainDispatch, tempSeed])

  useEffect(() => {
    if (!tempSeed) return
    if (!!submitButtonPressed && initParams && subType === 'seed') {
      setSubmitButtonPressed(false)
      goToNextRoute()
    }
  }, [goToNextRoute, tempSeed, initParams, submitButtonPressed, subType])

  const handleCopyToClipboard = useCallback(async () => {
    try {
      if (!tempSeed) return

      await setStringAsync(tempSeed.seed)
      addToast(t('Recovery phrase copied to clipboard'))
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      addToast(t('Failed to copy recovery phrase'))
    }
  }, [addToast, tempSeed, t])

  const seedArray = useMemo(() => {
    if (!tempSeed) return []

    return tempSeed.seed.split(' ')
  }, [tempSeed])

  return {
    handleSubmit,
    handleCopyToClipboard,
    seedArray,
    submitButtonPressed
  }
}
