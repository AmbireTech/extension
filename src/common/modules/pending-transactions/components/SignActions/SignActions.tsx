import { isTokenEligible } from 'ambire-common/src/helpers/sendTxnHelpers'
import { isValidCode } from 'ambire-common/src/services/validations'
import React, { useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Keyboard, View } from 'react-native'

import InfoIcon from '@common/assets/svg/InfoIcon'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import InputConfirmationCode from '@common/components/InputConfirmationCode'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { isWeb } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import isInt from '@common/utils/isInt'
import { delayPromise } from '@common/utils/promises'

import styles from './styles'

const SignActions = ({
  isInBottomSheet,
  closeBottomSheet,
  estimation,
  feeSpeed,
  approveTxn,
  rejectTxn,
  signingStatus,
  bundle,
  isGasTankEnabled,
  network,
  mustReplaceNonce,
  replaceTx,
  setReplaceTx,
  setSigningStatus
}: any) => {
  const {
    control,
    handleSubmit,
    resetField,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      code: ''
    }
  })
  const { t } = useTranslation()
  const { goBack } = useNavigation()
  // reset this every time the signing status changes
  useEffect(() => {
    !signingStatus && resetField('code')
  }, [signingStatus])

  const rejectButton = rejectTxn && <Button type="danger" text={t('Reject')} onPress={rejectTxn} />

  const feeNote =
    estimation?.success && estimation?.isDeployed === false && bundle.gasLimit ? (
      <View style={[flexboxStyles.directionRow, spacings.phSm, spacings.mbSm]}>
        <InfoIcon />
        <Text fontSize={12} style={[flexboxStyles.flex1, spacings.plTy]}>
          {t(
            'NOTE: Because this is your first Ambire transaction, this fee is {{fee}}% higher than usual because we have to deploy your smart wallet. Subsequent transactions will be cheaper.',
            { fee: ((60000 / bundle.gasLimit) * 100).toFixed() }
          )}
        </Text>
      </View>
    ) : null

  const insufficientFee =
    estimation &&
    estimation.feeInUSD &&
    !isTokenEligible(
      estimation.selectedFeeToken,
      feeSpeed,
      estimation,
      !!estimation.selectedFeeToken.isGasTankToken,
      network
    )

  const willFail = (estimation && !estimation.success) || insufficientFee

  const renderTitle = (title: string = t('Sign')) => {
    return (
      <Title type="small" style={textStyles.center}>
        {title}
      </Title>
    )
  }

  const handleRequestSignConfirmation = () => approveTxn({})

  const handleFormSubmit = useCallback(() => {
    !isWeb && Keyboard.dismiss()

    handleSubmit(async ({ code }: any) => {
      // wait state update before Wallet calcs because
      // when Wallet method is called on devices with slow CPU the UI freezes
      await delayPromise(100)
      await approveTxn({ code })
    })()
  }, [approveTxn, handleSubmit])

  if (willFail) {
    return (
      <Panel>
        {renderTitle()}
        {feeNote}
        {rejectButton}
      </Panel>
    )
  }
  // TODO:
  const isRecoveryMode =
    signingStatus && signingStatus.finalBundle && signingStatus.finalBundle.recoveryMode

  if (signingStatus && signingStatus.quickAcc) {
    return (
      <Panel>
        {renderTitle(t('Confirmation'))}
        {feeNote}
        <View>
          {signingStatus.confCodeRequired === 'otp' && (
            <Text style={spacings.mbSm}>{t('Please enter your OTP code.')}</Text>
          )}
          {signingStatus.confCodeRequired === 'notRequired' && (
            <Text style={spacings.mbSm} fontSize={12} color={colors.turquoise}>
              {t(
                'You already sent 3 or more transactions to this address, confirmation code is not needed.'
              )}
            </Text>
          )}
          {signingStatus.confCodeRequired === 'email' && (
            <Text style={spacings.mbSm} weight="medium">
              {t('A confirmation code was sent to your email.')}
            </Text>
          )}
        </View>
        {signingStatus.confCodeRequired !== 'notRequired' && (
          <Controller
            control={control}
            rules={{ validate: isValidCode }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputConfirmationCode
                confirmationType={signingStatus.confCodeRequired}
                onBlur={onBlur}
                onChangeText={onChange}
                disabled={signingStatus.inProgress}
                isValid={isValidCode(value)}
                value={value}
                error={errors.code && (t('Invalid confirmation code.') as string)}
              />
            )}
            name="code"
          />
        )}
        <View style={styles.buttonsContainer}>
          <View style={styles.buttonWrapper}>
            <Button type="danger" text={t('Cancel')} onPress={() => setSigningStatus(null)} />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              text={isSubmitting ? t('Confirming...') : t('Confirm')}
              disabled={
                isSubmitting ||
                (signingStatus.confCodeRequired !== 'notRequired' && !watch('code', ''))
              }
              onPress={handleFormSubmit}
            />
          </View>
        </View>
      </Panel>
    )
  }

  return (
    <Panel>
      {renderTitle()}
      {feeNote}
      {
        // If there's `bundle.nonce` set, it means we're cancelling or speeding up, so this shouldn't even be visible
        // We also don't show this in any case in which we're forced to replace a particular transaction (mustReplaceNonce)
        !isInt(bundle.nonce) && !isInt(mustReplaceNonce) && !!estimation?.nextNonce?.pendingBundle && (
          <View style={spacings.mbTy}>
            <Checkbox
              value={replaceTx}
              onValueChange={() => setReplaceTx((prev: any) => !prev)}
              label={t('Replace currently pending transaction')}
            />
          </View>
        )
      }

      <Button
        text={t('Sign Now')}
        onPress={handleRequestSignConfirmation}
        disabled={!estimation || !!signingStatus}
      />
      <Button
        text={t('Add to cart')}
        type="outline"
        onPress={() => {
          if (isInBottomSheet) {
            !!closeBottomSheet && closeBottomSheet()
          } else {
            goBack()
          }
        }}
        hasBottomSpacing={false}
      />
    </Panel>
  )
}

export default React.memo(SignActions)
