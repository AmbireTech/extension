import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import useToast from '@common/hooks/useToast'

export interface ChangeKeystorePasswordFormValues {
  password: string
  newPassword: string
  confirmNewPassword: string
}

const useChangeKeystorePassword = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { state, dispatch: keystoreDispatch } = useController('KeystoreController')
  const { getExtraEntropy } = useExtraEntropy()
  const {
    control,
    handleSubmit,
    watch,
    setError,
    getValues,
    trigger,
    reset,
    formState: { errors, isValid }
  } = useForm<ChangeKeystorePasswordFormValues>({
    mode: 'all',
    defaultValues: {
      password: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  })

  const newPassword = watch('newPassword', '')

  useEffect(() => {
    if (!getValues('confirmNewPassword')) return

    trigger('confirmNewPassword').catch(() => {
      addToast(t('Something went wrong, please try again later.'), { type: 'error' })
    })
  }, [newPassword, trigger, addToast, t, getValues])

  useEffect(() => {
    if (state.errorMessage) setError('password', { message: state.errorMessage })
  }, [state.errorMessage, setError])

  useEffect(() => {
    if (state.statuses.changeKeystorePassword === 'SUCCESS') reset()
  }, [reset, state.statuses.changeKeystorePassword])

  const resetErrorState = () =>
    keystoreDispatch({
      type: 'method',
      params: {
        method: 'resetErrorState',
        args: []
      }
    })

  const handleChangeKeystorePassword = handleSubmit(
    ({ password, newPassword: newPasswordFieldValue }) =>
      keystoreDispatch({
        type: 'method',
        params: {
          method: 'changeKeystorePassword',
          args: [newPasswordFieldValue, password, getExtraEntropy()]
        }
      })
  )

  return {
    control,
    errors,
    isValid,
    newPassword,
    status: state.statuses.changeKeystorePassword,
    errorMessage: state.errorMessage,
    hasPasswordSecret: state.hasPasswordSecret,
    resetErrorState,
    handleChangeKeystorePassword
  }
}

export type UseChangeKeystorePasswordReturn = ReturnType<typeof useChangeKeystorePassword>

export default useChangeKeystorePassword
