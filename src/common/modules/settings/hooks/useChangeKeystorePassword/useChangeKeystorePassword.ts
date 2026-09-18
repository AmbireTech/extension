import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Keyboard } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import useToast from '@common/hooks/useToast'

export interface ChangeKeystorePasswordFormValues {
  newPassword: string
  confirmNewPassword: string
}

const useChangeKeystorePassword = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { state, dispatch: keystoreDispatch } = useController('KeystoreController')
  const { getExtraEntropy } = useExtraEntropy()
  const {
    ref: confirmationModalRef,
    open: openConfirmation,
    close: closeConfirmation
  } = useModalize()
  // Held until the keystore is idle enough to accept it, see the effect below
  const [pendingChange, setPendingChange] = useState<{ oldPassword?: string } | null>(null)
  // Which pending change has already been sent. Keyed on the change itself rather than a plain
  // flag, so a second attempt after a wrong password is a new one and goes through, while the
  // effect re-running as the statuses settle does not send the same one twice.
  const dispatchedChangeRef = useRef<{ oldPassword?: string } | null>(null)
  const {
    control,
    handleSubmit,
    watch,
    getValues,
    trigger,
    reset,
    formState: { errors, isValid }
  } = useForm<ChangeKeystorePasswordFormValues>({
    mode: 'all',
    defaultValues: {
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
    if (state.statuses.changeKeystorePassword === 'SUCCESS') reset()
  }, [reset, state.statuses.changeKeystorePassword])

  // The old password is asked for in the confirmation sheet rather than as a third field, so
  // the user proves who they are the same way they do everywhere else in the app.
  const handleChangeKeystorePassword = handleSubmit(() => openConfirmation())

  // The confirmation stays up while the change runs - it is what shows the progress, and a wrong
  // password keeps it open with the error. It is closed once the change is through, and the
  // success is opened only after it has finished closing.
  const changePassword = useCallback((oldPassword?: string) => {
    Keyboard.dismiss()
    setPendingChange({ oldPassword })
  }, [])

  // Biometrics prove who the user is, and the old password is only ever used for that too - the
  // keystore re-wraps the main key it already holds, so there is nothing else to hand over.
  const changePasswordAfterBiometrics = useCallback(() => changePassword(), [changePassword])

  // The keystore refuses to start an action while another is still settling, and confirming is
  // an action of its own - it is only on its way back to idle when it reports that it passed. So
  // the change waits for that rather than racing it.
  useEffect(() => {
    if (!pendingChange || dispatchedChangeRef.current === pendingChange) return
    if (Object.values(state.statuses).some((status) => status !== 'INITIAL')) return

    dispatchedChangeRef.current = pendingChange
    keystoreDispatch({
      type: 'method',
      params: {
        method: 'changeKeystorePassword',
        args: [getValues('newPassword'), pendingChange.oldPassword, getExtraEntropy()]
      }
    })
  }, [pendingChange, state.statuses, keystoreDispatch, getValues, getExtraEntropy])

  return {
    control,
    errors,
    isValid,
    newPassword,
    status: state.statuses.changeKeystorePassword,
    hasPasswordSecret: state.hasPasswordSecret,
    handleChangeKeystorePassword,
    confirmationModalRef,
    closeConfirmation,
    changePassword,
    changePasswordAfterBiometrics
  }
}

export type UseChangeKeystorePasswordReturn = ReturnType<typeof useChangeKeystorePassword>

export default useChangeKeystorePassword
