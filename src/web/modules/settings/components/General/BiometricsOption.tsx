import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import ControlOption from '@common/components/ControlOption'
import FatToggle from '@common/components/FatToggle'
import useBiometrics from '@common/hooks/useBiometrics'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'

const BiometricsOption = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { isLoading, hasBiometricsHardware, saveBiometricsSecret, removeBiometricsSecret } =
    useBiometrics()

  const {
    state: { hasBiometricsSecret, hasPasswordSecret, statuses },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')

  const [isBusy, setIsBusy] = useState(false)
  const shouldCleanUpWebAuthnCredential = useRef(false)

  useEffect(() => {
    if (statuses.addSecret === 'SUCCESS') {
      shouldCleanUpWebAuthnCredential.current = false
      setIsBusy(false)
      addToast(t('Biometrics unlock is now enabled.'), { type: 'success' })
    }

    if (statuses.addSecret === 'ERROR') {
      if (shouldCleanUpWebAuthnCredential.current) {
        removeBiometricsSecret().catch(() => {})
      }
      shouldCleanUpWebAuthnCredential.current = false
      setIsBusy(false)
    }
  }, [addToast, removeBiometricsSecret, statuses.addSecret, t])

  useEffect(() => {
    if (statuses.removeSecret === 'SUCCESS') {
      removeBiometricsSecret().catch(() => {})
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

  const toggleBiometrics = async () => {
    if (disabled) return

    setIsBusy(true)

    if (hasBiometricsSecret) {
      keystoreDispatch({
        type: 'method',
        params: {
          method: 'removeSecret',
          args: ['biometrics']
        }
      })

      return
    }

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
        args: ['biometrics', secret, '', true]
      }
    })
  }

  return (
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
  )
}

export default React.memo(BiometricsOption)
