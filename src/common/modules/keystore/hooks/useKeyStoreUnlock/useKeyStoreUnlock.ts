import { useCallback, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import { isDev, isTesting } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useDisableNavigatingBack from '@common/hooks/useDisableNavigatingBack'
import useNavigation from '@common/hooks/useNavigation'
import { DEFAULT_KEYSTORE_PASSWORD_DEV } from '@env'

const useKeyStoreUnlock = () => {
  const { t } = useTranslation()

  const { navigate } = useNavigation()
  const {
    state: { isUnlocked, statuses, errorMessage },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors }
  } = useForm({
    mode: 'all',
    defaultValues: {
      password: isDev && !isTesting ? (DEFAULT_KEYSTORE_PASSWORD_DEV ?? '') : ''
    }
  })

  useDisableNavigatingBack()

  const passwordFieldValue = watch('password')

  useEffect(() => {
    if (errorMessage) setError('password', { message: errorMessage })
  }, [errorMessage, setError])

  useEffect(() => {
    if (isUnlocked) navigate('/')
  }, [navigate, isUnlocked])

  const disableSubmit = useMemo(
    () => statuses.unlockWithSecret !== 'INITIAL' || !!errorMessage,
    [statuses.unlockWithSecret, errorMessage]
  )

  const passwordFieldError = useMemo(() => {
    if (!errors.password) return undefined

    if (passwordFieldValue.length < 8) {
      return t('Please fill in at least 8 characters for password.')
    }

    return errors.password.message || t('Invalid password')
  }, [errors.password, passwordFieldValue.length, t])

  const handleUnlock = useCallback(
    ({ password }: { password: string }) => {
      if (disableSubmit) return

      keystoreDispatch({
        type: 'method',
        params: {
          method: 'unlockWithSecret',
          args: ['password', password]
        }
      })
    },
    [disableSubmit, keystoreDispatch]
  )

  return {
    control,
    handleSubmit,
    watch,
    setError,
    disableSubmit,
    errors,
    passwordFieldError,
    handleUnlock
  }
}

export default useKeyStoreUnlock
