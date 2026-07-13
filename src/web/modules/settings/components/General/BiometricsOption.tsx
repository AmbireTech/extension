import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useModalize } from 'react-native-modalize'

import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import useBiometrics from '@common/hooks/useBiometrics'
import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import BottomSheetPasswordConfirmation from '@web/modules/settings/components/BottomSheetPasswordConfirmation'

const BiometricsOption = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { isLoading, hasBiometricsHardware, saveBiometricsSecret, removeBiometricsSecret } =
    useBiometrics()
  const { getExtraEntropy } = useExtraEntropy()

  const {
    state: { hasBiometricsSecret, hasPasswordSecret, statuses },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')
  const {
    ref: sheetRefConfirmPassword,
    open: openConfirmPassword,
    close: closeConfirmPassword
  } = useModalize()

  const [isBusy, setIsBusy] = useState(false)
  const shouldCleanUpWebAuthnCredential = useRef(false)

  useEffect(() => {
    if (statuses.addSecret === 'SUCCESS') {
      shouldCleanUpWebAuthnCredential.current = false
      setIsBusy(false)
      addToast(t('Biometrics unlock is now enabled.'), { type: 'success' })
    }

    if (statuses.addSecret === 'ERROR') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      if (shouldCleanUpWebAuthnCredential.current) removeBiometricsSecret()
      shouldCleanUpWebAuthnCredential.current = false
      setIsBusy(false)
    }
  }, [addToast, removeBiometricsSecret, statuses.addSecret, t])

  useEffect(() => {
    if (statuses.removeSecret === 'SUCCESS') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      removeBiometricsSecret()
      setIsBusy(false)
      addToast(t('Biometrics unlock is now disabled.'), { type: 'success' })
    }

    if (statuses.removeSecret === 'ERROR') {
      setIsBusy(false)
    }
  }, [addToast, removeBiometricsSecret, statuses.removeSecret, t])

  const disabled = useMemo(
    () =>
      isBusy ||
      statuses.addSecret !== 'INITIAL' ||
      statuses.removeSecret !== 'INITIAL' ||
      isLoading,
    [isBusy, isLoading, statuses.addSecret, statuses.removeSecret]
  )

  if (!hasPasswordSecret || (!isLoading && !hasBiometricsHardware)) return null

  const closePasswordConfirmation = useCallback(() => {
    keystoreDispatch({
      type: 'method',
      params: {
        method: 'resetErrorState',
        args: []
      }
    })
    closeConfirmPassword()
  }, [closeConfirmPassword, keystoreDispatch])

  const enableBiometrics = useCallback(async () => {
    closePasswordConfirmation()
    setIsBusy(true)

    const secret = await saveBiometricsSecret()
    if (!secret) {
      setIsBusy(false)
      addToast(t('Biometrics setup was cancelled or failed.'), { type: 'error' })
      return
    }

    shouldCleanUpWebAuthnCredential.current = true
    keystoreDispatch({
      type: 'method',
      params: {
        method: 'addSecret',
        args: ['biometrics', secret, getExtraEntropy(), true]
      }
    })
  }, [
    addToast,
    closePasswordConfirmation,
    getExtraEntropy,
    keystoreDispatch,
    saveBiometricsSecret,
    t
  ])

  const toggleBiometrics = useCallback(() => {
    if (disabled) return

    if (hasBiometricsSecret) {
      setIsBusy(true)
      keystoreDispatch({
        type: 'method',
        params: {
          method: 'removeSecret',
          args: ['biometrics']
        }
      })

      return
    }

    openConfirmPassword()
  }, [disabled, hasBiometricsSecret, keystoreDispatch, openConfirmPassword])

  return (
    <>
      <ControlOption
        title={t('Biometrics unlock')}
        description={t('Use WebAuthn biometrics to unlock your wallet on this device.')}
        style={spacings.mbTy}
        renderIcon={<FingerprintIcon width={24} height={24} />}
      >
        <FatToggle
          isOn={hasBiometricsSecret}
          onToggle={toggleBiometrics}
          style={spacings.mr0}
          disabled={disabled}
        />
      </ControlOption>
      <BottomSheetPasswordConfirmation
        sheetRef={sheetRefConfirmPassword}
        closeBottomSheet={closePasswordConfirmation}
        text={t('Please enter your extension password to enable biometrics unlock.')}
        onPasswordConfirmed={enableBiometrics}
      />
    </>
  )
}

export default React.memo(BiometricsOption)
