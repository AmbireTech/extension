import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { isDev, isTesting } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import useToast from '@common/hooks/useToast'
import { DEFAULT_KEYSTORE_PASSWORD_DEV } from '@env'

const useKeyStoreSetup = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const state = useController('KeystoreController').state
  const { dispatch } = useControllersMiddleware()
  const { control, handleSubmit, watch, trigger, getValues, formState } = useForm({
    mode: 'all',
    defaultValues: {
      password: isDev && !isTesting ? (DEFAULT_KEYSTORE_PASSWORD_DEV ?? '') : '',
      confirmPassword: isDev && !isTesting ? (DEFAULT_KEYSTORE_PASSWORD_DEV ?? '') : ''
    }
  })
  const [isKeystoreReady, setKeystoreReady] = useState(false)
  const password = watch('password', '')

  useEffect(() => {
    if (!getValues('confirmPassword')) return

    trigger('confirmPassword').catch(() => {
      addToast(t('Something went wrong, please try again later.'), { type: 'error' })
    })
  }, [password, trigger, addToast, t, getValues])

  useEffect(() => {
    if (state.statuses.addSecret === 'SUCCESS') {
      setKeystoreReady(true)
    }
  }, [state.statuses.addSecret])

  const { getExtraEntropy } = useExtraEntropy()

  const handleKeystoreSetup = async () => {
    await handleSubmit(({ password: passwordFieldValue }) => {
      dispatch({
        type: 'KEYSTORE_CONTROLLER_ADD_SECRET',
        params: {
          secretId: 'password',
          secret: passwordFieldValue,
          extraEntropy: getExtraEntropy(),
          leaveUnlocked: true
        }
      })
    })()
  }

  const isKeystoreSetupLoading = state.statuses.addSecret !== 'INITIAL'

  return {
    isKeystoreReady,
    isKeystoreSetupLoading,
    formState,
    control,
    password,
    handleKeystoreSetup,
    hasPasswordSecret: state.hasPasswordSecret
  }
}

export default useKeyStoreSetup
