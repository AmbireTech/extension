import React, { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { EmailVaultState } from '@ambire-common/controllers/emailVault/emailVault'
import { isEmail } from '@ambire-common/services/validations'
import KeyStoreIcon from '@common/assets/svg/KeyStoreIcon'
import Banner from '@common/components/Banner'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import EmailConfirmation from '../EmailConfirmation'

const EmailForm = () => {
  const { t } = useTranslation()
  const { themeType } = useTheme()
  const {
    control,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: { email: '' }
  })

  const { state: emailVault, dispatch: evDispatch } = useController('EmailVaultController')
  const {
    ref: confirmationModalRef,
    open: openConfirmationModal,
    close: closeConfirmationModal
  } = useModalize()

  const isWaitingConfirmation = useMemo(
    () => emailVault.currentState === EmailVaultState.WaitingEmailConfirmation,
    [emailVault.currentState]
  )
  const prevIsWaitingConfirmation = usePrevious(isWaitingConfirmation)
  useEffect(() => {
    if (!prevIsWaitingConfirmation && isWaitingConfirmation) {
      openConfirmationModal()
    }

    if (prevIsWaitingConfirmation && !isWaitingConfirmation) {
      closeConfirmationModal()
    }
  }, [
    closeConfirmationModal,
    prevIsWaitingConfirmation,
    isWaitingConfirmation,
    openConfirmationModal
  ])

  const email = useMemo(() => emailVault.keystoreRecoveryEmail, [emailVault.keystoreRecoveryEmail])

  const formEmail = watch('email')

  useEffect(() => {
    if (!formEmail && !!email && isEmail(email) && isWaitingConfirmation) {
      setValue('email', email)
    }
  }, [formEmail, email, isWaitingConfirmation, setValue])

  const handleSendRecoveryEmail = useCallback(async () => {
    evDispatch({
      type: 'method',
      params: {
        method: 'handleMagicLinkKey',
        args: [formEmail, undefined, 'recovery']
      }
    })
  }, [formEmail, evDispatch])

  const handleCancelLoginAttempt = useCallback(() => {
    evDispatch({
      type: 'method',
      params: {
        method: 'cancelEmailConfirmation',
        args: []
      }
    })
    closeConfirmationModal()
  }, [evDispatch, closeConfirmationModal])

  return (
    <>
      <ScrollableWrapper>
        <View style={[flexbox.alignCenter, spacings.mbXl]}>
          <KeyStoreIcon />
        </View>
        <Text fontSize={16} weight="semiBold" style={spacings.mbTy}>
          {t("We don't store your extension password.")}
        </Text>
        <Text fontSize={14} appearance="secondaryText" style={spacings.mbSm}>
          {t(
            'Enter your email to receive a confirmation link and set a new password. This keeps your wallet secure and accessible only to you.'
          )}
        </Text>
        <Banner
          type="info"
          style={spacings.mbMd}
          title={t('Recovery works only if you have already enabled it in settings.')}
          titleFontSize={14}
        />
        <Controller
          control={control}
          // @ts-ignore minot type mismatch, (value) => isEmail(value) has no warns
          rules={{ validate: isEmail }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('Please enter your email')}
              editable={!isWaitingConfirmation}
              onBlur={onBlur}
              placeholder={t('Email Address')}
              onChangeText={onChange}
              onSubmitEditing={handleSendRecoveryEmail}
              value={value}
              autoFocus={isWeb}
              isValid={isEmail(value)}
              error={!!errors.email && (t('Please fill in a valid email.') as string)}
            />
          )}
          name="email"
        />
      </ScrollableWrapper>
      <View style={spacings.pt}>
        <Button
          disabled={!isValid || isWaitingConfirmation}
          size="large"
          onPress={handleSendRecoveryEmail}
          hasBottomSpacing={false}
          text={t('Send confirmation email')}
        />
      </View>
      <BottomSheet
        id="keystore-reset-confirmation-modal"
        sheetRef={confirmationModalRef}
        style={{ width: 400 }}
        backgroundColor={
          themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
        }
        autoOpen={isWaitingConfirmation}
        shouldBeClosableOnDrag={false}
      >
        <EmailConfirmation email={formEmail} handleCancelLoginAttempt={handleCancelLoginAttempt} />
      </BottomSheet>
    </>
  )
}

export default React.memo(EmailForm)
