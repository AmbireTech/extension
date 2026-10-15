import { useCallback, useEffect, useRef, useState } from 'react'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import { TERMS_VERSION } from '@common/modules/terms/components/TermsComponent'
import { storage } from '@common/services/storage'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectHasPasswordSecret = (state: AllControllersMappingType['KeystoreController']) =>
  state.hasPasswordSecret
const selectIsReadyToStoreKeys = (state: AllControllersMappingType['KeystoreController']) =>
  state.isReadyToStoreKeys
const selectAddSecretStatus = (state: AllControllersMappingType['KeystoreController']) =>
  state.statuses.addSecret

/**
 * Registers the password of the exporting device as this device's own password after a
 * sync import, and optionally biometrics along with it - the two things the keystore
 * setup screen does, so that the onboarding can skip it after a sync.
 */
const useSyncedPasswordSetup = ({ onPasswordSet }: { onPasswordSet: () => void }) => {
  const { state: hasPasswordSecret } = useController('KeystoreController', selectHasPasswordSecret)
  const { state: isReadyToStoreKeys } = useController(
    'KeystoreController',
    selectIsReadyToStoreKeys
  )
  const { state: addSecretStatus } = useController('KeystoreController', selectAddSecretStatus)
  const { dispatch: keystoreDispatch } = useController('KeystoreController')
  const { getExtraEntropy } = useExtraEntropy()
  const [isPasswordDispatched, setIsPasswordDispatched] = useState(false)
  // Held between registering the password and the keystore becoming unlocked, which is
  // the earliest the biometrics secret can be handed to it
  const pendingBiometricsSecret = useRef<string | null>(null)
  const hasFinished = useRef(false)

  // The keystore's own state says the password landed, instead of the transient SUCCESS
  // status, which mobile can collapse before the UI ever sees it
  const isPasswordStored = hasPasswordSecret && isReadyToStoreKeys
  // A failure is reported by the controller itself, so it only has to let the user retry
  const isSettingPassword = isPasswordDispatched && !isPasswordStored && addSecretStatus !== 'ERROR'

  const setPasswordFromSync = useCallback(
    ({ password, biometricsSecret }: { password: string; biometricsSecret: string | null }) => {
      pendingBiometricsSecret.current = biometricsSecret
      setIsPasswordDispatched(true)

      // The keystore setup screen this replaces records the terms acceptance, so the
      // flow that skips that screen records it too. Not awaited, because failing to
      // write the record must not stop the password from being set.
      storage
        .set('termsState', { version: TERMS_VERSION, acceptedAt: Date.now() })
        .catch(captureException)

      keystoreDispatch({
        type: 'method',
        params: { method: 'addSecret', args: ['password', password, getExtraEntropy(), true] }
      })
    },
    [getExtraEntropy, keystoreDispatch]
  )

  useEffect(() => {
    if (!isPasswordDispatched || !isPasswordStored || hasFinished.current) return

    hasFinished.current = true

    if (pendingBiometricsSecret.current) {
      keystoreDispatch({
        type: 'method',
        params: {
          method: 'addSecret',
          args: ['biometrics', pendingBiometricsSecret.current, getExtraEntropy(), true]
        }
      })
      pendingBiometricsSecret.current = null
    }

    onPasswordSet()
  }, [getExtraEntropy, isPasswordDispatched, isPasswordStored, keystoreDispatch, onPasswordSet])

  return { setPasswordFromSync, isSettingPassword }
}

export default useSyncedPasswordSetup
