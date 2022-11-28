import React from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { isWeb } from '@config/env'
import BottomSheet from '@modules/common/components/BottomSheet'
import Button from '@modules/common/components/Button'
import NumberInput from '@modules/common/components/NumberInput'
import Spinner from '@modules/common/components/Spinner'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import useNetwork from '@modules/common/hooks/useNetwork'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'
import HardwareWalletSelectConnection from '@modules/hardware-wallet/components/HardwareWalletSelectConnection'

import styles from './styles'

export type ExternalSignerBottomSheetType = {
  sheetRef: any
  openBottomSheet: (dest?: 'top' | 'default' | undefined) => void
  closeBottomSheet: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}

export type QuickAccBottomSheetType = {
  sheetRef: any
  openBottomSheet: (dest?: 'top' | 'default' | undefined) => void
  closeBottomSheet: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}

export type HardwareWalletBottomSheetType = {
  sheetRef: any
  openBottomSheet: (dest?: 'top' | 'default' | undefined) => void
  closeBottomSheet: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}

interface Props {
  isLoading: boolean
  approve: any
  resolve: any
  quickAccBottomSheet: QuickAccBottomSheetType
  hardwareWalletBottomSheet: HardwareWalletBottomSheetType
  confirmationType: string | null
  isDeployed: boolean | null
  hasPrivileges: boolean | null
}

const SignActions = ({
  isLoading,
  approve,
  resolve,
  quickAccBottomSheet,
  hardwareWalletBottomSheet,
  confirmationType,
  isDeployed,
  hasPrivileges
}: Props) => {
  const { t } = useTranslation()
  const { network } = useNetwork()

  const { handleSubmit, setValue, watch } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      code: ''
    }
  })

  return (
    <>
      <View>
        {isDeployed === null && (
          <View style={[spacings.mbMd, flexboxStyles.alignCenter, flexboxStyles.justifyCenter]}>
            <Spinner />
          </View>
        )}
        {isDeployed === false && (
          <View style={[spacings.mbMd, spacings.phSm]}>
            <Text appearance="danger" fontSize={12}>
              {t("You can't sign this message yet.")}
            </Text>
            <Text appearance="danger" fontSize={12}>
              {t(
                `You need to complete your first transaction on ${network?.name} to be able to sign messages.`
              )}
            </Text>
          </View>
        )}
        {!hasPrivileges && (
          <View style={[spacings.mbMd, spacings.phSm]}>
            <Text appearance="danger" fontSize={12}>
              {t('You do not have the privileges to sign this message.')}
            </Text>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <View style={styles.buttonWrapper}>
            <Button
              type="danger"
              text={t('Reject')}
              onPress={() => resolve({ message: t('signature denied') })}
            />
          </View>
          <View style={styles.buttonWrapper}>
            <Button
              text={isLoading ? t('Signing...') : t('Sign')}
              onPress={approve}
              disabled={isLoading || !isDeployed}
            />
          </View>
        </View>
      </View>
      <BottomSheet
        id="sign"
        closeBottomSheet={quickAccBottomSheet.closeBottomSheet}
        sheetRef={quickAccBottomSheet.sheetRef}
      >
        <Title style={textStyles.center}>{t('Confirmation code')}</Title>
        {(confirmationType === 'email' || !confirmationType) && (
          <Text style={spacings.mb}>
            {t('A confirmation code has been sent to your email, it is valid for 3 minutes.')}
          </Text>
        )}
        {confirmationType === 'otp' && (
          <Text style={spacings.mbTy}>{t('Please enter your OTP code.')}</Text>
        )}
        <NumberInput
          placeholder={
            confirmationType === 'otp' ? t('Authenticator OTP code') : t('Confirmation code')
          }
          onChangeText={(val) => setValue('code', val)}
          keyboardType="numeric"
          autoCorrect={false}
          value={watch('code', '')}
          autoFocus={!isWeb}
        />
        <Button
          text={t('Confirm')}
          disabled={!watch('code', '')}
          onPress={() => {
            handleSubmit(approve)()
            setValue('code', '')
            quickAccBottomSheet.closeBottomSheet()
          }}
        />
      </BottomSheet>
      <BottomSheet
        id="hardware-wallet-sign"
        sheetRef={hardwareWalletBottomSheet.sheetRef}
        closeBottomSheet={hardwareWalletBottomSheet.closeBottomSheet}
      >
        <HardwareWalletSelectConnection
          onSelectDevice={(device: any) => {
            approve({ device })
            hardwareWalletBottomSheet.closeBottomSheet()
          }}
          shouldWrap={false}
        />
      </BottomSheet>
    </>
  )
}

export default SignActions
