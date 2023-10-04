import usePrevious from 'ambire-common/src/hooks/usePrevious'
import { toUtf8String } from 'ethers/lib/utils'
import React, { useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import Blockies from '@common/components/Blockies'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import InputConfirmationCode from '@common/components/InputConfirmationCode'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import useAccounts from '@common/hooks/useAccounts'
import useDisableNavigatingBack from '@common/hooks/useDisableNavigatingBack'
import useNavigation from '@common/hooks/useNavigation'
import useRequests from '@common/hooks/useRequests'
import SignActions from '@common/modules/sign-message/components/SignActions'
import useSignMessage from '@common/modules/sign-message/hooks/useSignMessage'
import { UseSignMessageProps } from '@common/modules/sign-message/hooks/useSignMessage/types'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import HardwareWalletSelectConnection from '@mobile/modules/hardware-wallet/components/HardwareWalletSelectConnection'
import { errorCodes } from '@web/constants/errors'
import { getUiType } from '@web/utils/uiType'

import styles from './styles'

function getMessageAsText(msg: any) {
  try {
    return toUtf8String(msg)
  } catch (_) {
    return msg
  }
}

const shortenedAddress = (address: any) => `${address.slice(0, 5)}...${address.slice(-3)}`
const walletType = (signerExtra: any) => {
  if (signerExtra && signerExtra.type === 'ledger') return 'Ledger'
  if (signerExtra && signerExtra.type === 'trezor') return 'Trezor'
  return 'Web3'
}

const SignScreenScreen = ({
  isInBottomSheet,
  closeBottomSheet
}: {
  isInBottomSheet?: boolean
  closeBottomSheet?: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}) => {
  const { t } = useTranslation()
  const navigation = useNavigation()
  const { account } = useAccounts()
  const { everythingToSign, resolveMany } = useRequests()

  const { handleSubmit, setValue, watch } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      code: ''
    }
  })

  if (getUiType().isNotification) {
    navigation.navigate = () => null
    navigation.goBack = () => null
  }

  const resolve = (outcome: any) => resolveMany([everythingToSign[0].id], outcome)

  if (!isInBottomSheet) {
    useDisableNavigatingBack(navigation)
  }

  const {
    ref: sheetRefQickAcc,
    open: openBottomSheetQickAcc,
    close: closeBottomSheetQickAcc
  } = useModalize()
  const {
    ref: sheetRefHardwareWallet,
    open: openBottomSheetHardwareWallet,
    close: closeBottomSheetHardwareWallet
  } = useModalize()

  const onConfirmationCodeRequired: UseSignMessageProps['onConfirmationCodeRequired'] = () => {
    openBottomSheetQickAcc()

    return Promise.resolve()
  }

  const {
    approve,
    setLoading,
    msgToSign,
    isLoading,
    hasPrivileges,
    isDeployed,
    dataV4,
    confirmationType,
    typeDataErr
  } = useSignMessage({
    account,
    messagesToSign: everythingToSign,
    resolve,
    onConfirmationCodeRequired,
    openBottomSheetHardwareWallet,
    isInBottomSheet
  })

  const prevToSign = usePrevious(msgToSign || {})

  useEffect(() => {
    if (!Object.keys(msgToSign || {}).length && Object.keys(prevToSign || {}).length) {
      if (isInBottomSheet) {
        !!closeBottomSheet && closeBottomSheet()
      } else {
        navigation.goBack()
      }
    }
  }, [msgToSign, navigation, prevToSign, isInBottomSheet, closeBottomSheet])

  const resetLoadingState = useCallback(() => setLoading(false), [setLoading])

  if (!msgToSign || !account) return null

  const GradientWrapper = isInBottomSheet ? React.Fragment : GradientBackgroundWrapper

  if (typeDataErr) {
    return (
      <GradientWrapper>
        <Wrapper style={isInBottomSheet && spacings.ph0}>
          <Panel>
            <Text fontSize={17} appearance="danger" style={spacings.mb}>
              {t('Invalid signing request: {{typeDataErr}}', { typeDataErr })}
            </Text>
            <Button
              type="danger"
              text={t('Reject')}
              onPress={() =>
                resolve({
                  message: 'Signature denied',
                  code: errorCodes.provider.userRejectedRequest
                })
              }
            />
          </Panel>
        </Wrapper>
      </GradientWrapper>
    )
  }

  return (
    <>
      <GradientWrapper>
        <Wrapper
          type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
          extraHeight={180}
          style={isInBottomSheet && spacings.ph0}
        >
          <Title
            style={[textStyles.center, isInBottomSheet ? spacings.mb : spacings.mbTy]}
            hasBottomSpacing={false}
          >
            {t('Signing with account')}
          </Title>
          <Panel type="filled" contentContainerStyle={[spacings.pvTy, spacings.phTy]}>
            <View style={[flexboxStyles.directionRow, flexboxStyles.alignCenter]}>
              <Blockies seed={account?.id} />
              <View style={[flexboxStyles.flex1, spacings.plTy]}>
                <Text style={spacings.mbMi} numberOfLines={1} ellipsizeMode="middle" fontSize={12}>
                  {account.id}
                </Text>
                <Text type="info" color={colors.titan_50}>
                  {account.email
                    ? t('Email/Password account ({{email}})', { email: account?.email })
                    : `${walletType(account?.signerExtra)} (${shortenedAddress(
                        account?.signer?.address
                      )})`}
                </Text>
              </View>
            </View>
          </Panel>
          <Panel>
            <Title type="small">{t('Sign message')}</Title>
            {/* TODO: display dapp source */}
            <Text style={spacings.mbTy}>{t('A dApp is requesting your signature.')}</Text>

            <Text style={spacings.mbTy} color={colors.titan_50} fontSize={14}>
              {everythingToSign?.length > 1
                ? t('You have {{number}} more pending requests.', {
                    number: (everythingToSign?.length || 0) - 1
                  })
                : ''}
            </Text>
            <View style={styles.textarea}>
              <Text fontSize={12}>
                {dataV4 ? JSON.stringify(dataV4, '\n', ' ') : getMessageAsText(msgToSign.txn)}
              </Text>
            </View>
            <SignActions
              isLoading={isLoading}
              approve={approve}
              resolve={resolve}
              hasPrivileges={hasPrivileges}
              isDeployed={isDeployed}
            />
          </Panel>
        </Wrapper>
      </GradientWrapper>
      <BottomSheet
        id="sign"
        closeBottomSheet={closeBottomSheetQickAcc}
        onClosed={resetLoadingState}
        sheetRef={sheetRefQickAcc}
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
        <InputConfirmationCode
          confirmationType={confirmationType}
          onChangeText={(val) => setValue('code', val)}
          value={watch('code', '')}
        />
        <Button
          text={t('Confirm')}
          disabled={!watch('code', '')}
          onPress={() => {
            handleSubmit(approve)()
            setValue('code', '')
            closeBottomSheetQickAcc()
          }}
        />
      </BottomSheet>
      <BottomSheet
        id="hardware-wallet-sign"
        sheetRef={sheetRefHardwareWallet}
        closeBottomSheet={closeBottomSheetHardwareWallet}
        onClosed={resetLoadingState}
      >
        <HardwareWalletSelectConnection
          onSelectDevice={(device: any) => {
            approve({ device })
            closeBottomSheetHardwareWallet()
          }}
          shouldWrap={false}
        />
      </BottomSheet>
    </>
  )
}

export default SignScreenScreen
