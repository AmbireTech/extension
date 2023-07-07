import React, { useCallback, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import Button from '@common/components/Button'
import CopyText from '@common/components/CopyText'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import useAccounts from '@common/hooks/useAccounts'
import useNavigation from '@common/hooks/useNavigation'
import CountdownTimer from '@common/modules/settings/components/CountdownTimer'
import useOtp2Fa from '@common/modules/settings/hooks/useOtp2Fa'
import spacings, { DEVICE_WIDTH } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props {}

export interface EnableOTP2FaFormValues {
  emailConfirmCode: string
  otpCode: string
}

const EnableOTP2FaForm: React.FC<Props> = () => {
  const { t } = useTranslation()
  const { account } = useAccounts()
  const { goBack } = useNavigation()
  const qrCodeRef: any = useRef(null)
  const [shouldDisplayQR, setShouldDisplayQR] = useState(false)
  const [isTimeIsUp, setIsTimeIsUp] = useState(false)
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      emailConfirmCode: '',
      otpCode: ''
    }
  })

  const { otpAuth, sendEmail, secret, isSendingEmail, verifyOTP } = useOtp2Fa({
    accountId: account?.id,
    email: account?.email
  })

  const onSubmit = useCallback(
    (formValues: EnableOTP2FaFormValues) => verifyOTP(formValues),
    [verifyOTP]
  )

  const handleTimeIsUp = () => setIsTimeIsUp(true)
  const handleDisplayQr = () => setShouldDisplayQR(true)

  if (isTimeIsUp) {
    return (
      <>
        <Text appearance="danger" fontSize={15} weight="regular" style={spacings.mb}>
          {t(
            'The time is up. There is a 3 minute security threshold within you need to complete your set up. Please trigger the 2FA enable process again to reset your session.'
          )}
        </Text>
        <Button text={t('Cancel')} onPress={goBack} />
      </>
    )
  }

  return (
    <>
      <Text fontSize={15} weight="regular" style={spacings.mbSm}>
        {t('1) Request and confirm the code sent to your Email.')}
      </Text>
      <Button
        disabled={isSendingEmail || !!secret}
        text={isSendingEmail ? t('Sending...') : secret ? t('Email Sent') : t('Send Email')}
        onPress={sendEmail}
      />
      {!!secret && (
        <>
          <Text fontSize={15} weight="regular" style={spacings.mbMi}>
            Email sent! For security, you have a 3-minute timer to complete the process.
          </Text>
          <View style={[flexbox.center, spacings.mbLg]}>
            <CountdownTimer seconds={180} setTimeIsUp={handleTimeIsUp} />
          </View>
        </>
      )}
      {!!secret && (
        <Controller
          control={control}
          rules={{ required: t('Please fill in a code.') as string }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              onBlur={onBlur}
              placeholder={t('Email confirmation code')}
              onChangeText={onChange}
              value={value}
              keyboardType="email-address"
              containerStyle={spacings.mbLg}
            />
          )}
          name="emailConfirmCode"
        />
      )}

      {!!secret && (
        <>
          <Text fontSize={15} weight="regular" style={spacings.mbMi}>
            {t(
              '2) If you are on the same device, please copy and enter manually this setup key in your authenticator app:'
            )}
          </Text>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Text selectable weight="semiBold" style={{ flexShrink: 1 }}>
              {secret}
            </Text>
            <CopyText
              text={secret}
              style={[spacings.mlMi, { alignItems: 'flex-start', justifyContent: 'flex-start' }]}
            />
          </View>

          <Text style={[spacings.mtTy, spacings.mbMi]} fontSize={15}>
            ... or if your authenticator app is on a different device, you can also{' '}
            {shouldDisplayQR ? (
              <Text>scan this QR code:</Text>
            ) : (
              <Text weight="semiBold" onPress={handleDisplayQr}>
                generate a QRcode.
              </Text>
            )}
          </Text>
          {shouldDisplayQR && (
            <View style={[flexbox.center, spacings.mtSm]}>
              <QRCode
                value={otpAuth}
                size={DEVICE_WIDTH / 1.5}
                quietZone={10}
                getRef={qrCodeRef}
                onError={() => t('Failed to load QR code!')}
              />
            </View>
          )}

          <Text fontSize={15} weight="regular" style={[spacings.mbSm, spacings.mt]}>
            {t('3) Enter the code from your authenticator app')}
          </Text>
          <Controller
            control={control}
            rules={{ required: t('Please fill in a code.') as string }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                onBlur={onBlur}
                placeholder={t('OTP code')}
                onChangeText={onChange}
                value={value}
                keyboardType="email-address"
                containerStyle={spacings.mb}
              />
            )}
            name="otpCode"
          />

          <Button
            disabled={isSubmitting || !isValid}
            text={isSubmitting ? t('Enabling...') : t('Enable 2FA')}
            onPress={handleSubmit(onSubmit)}
            style={spacings.mbLg}
          />
        </>
      )}
    </>
  )
}

export default EnableOTP2FaForm
