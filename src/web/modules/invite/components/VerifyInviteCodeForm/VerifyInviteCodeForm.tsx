import { useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'

import Button from '@common/components/Button'
import Input from '@common/components/Input'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import { INVITE_STATUS } from '@web/extension-services/background/controllers/invite'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useInviteControllerState from '@web/hooks/useInviteControllerState'

const VerifyInviteCodeForm: React.FC<any> = () => {
  const { navigate } = useNavigation()
  const { dispatch } = useBackgroundService()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { inviteStatus } = useInviteControllerState()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: {
      code: ''
    }
  })

  // If the invite status verified, navigate out from this route to 1) navigate
  // on success and 2) prevent someone from navigating to this route directly.
  useEffect(() => {
    if (inviteStatus === INVITE_STATUS.VERIFIED) {
      addToast(t('Your invite code was verified successfully.'), { type: 'success' })
      navigate('/')
    }
  }, [addToast, inviteStatus, navigate, t])

  const handleFormSubmit = useCallback(
    () =>
      handleSubmit(({ code }) => {
        dispatch({
          type: 'INVITE_CONTROLLER_VERIFY',
          params: { code }
        })
      })(),
    [dispatch, handleSubmit]
  )

  return (
    <>
      <Controller
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label={t('Please insert your invitation code')}
            onBlur={onBlur}
            placeholder={t('Invite Code')}
            onChangeText={onChange}
            onSubmitEditing={handleFormSubmit}
            value={value}
            autoFocus={isWeb}
            isValid={!errors.code && value.length > 0}
            error={errors.code && (t('Please fill in an invite code.') as string)}
          />
        )}
        name="code"
      />

      <Button
        disabled={isSubmitting || !isValid}
        type="primary"
        text={isSubmitting ? t('Validating...') : t('Verify')}
        onPress={handleFormSubmit}
      />
    </>
  )
}

export default VerifyInviteCodeForm
