import usePrevious from 'ambire-common/src/hooks/usePrevious'
import { toUtf8String } from 'ethers/lib/utils'
import React, { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Image, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import Blockies from '@modules/common/components/Blockies'
import BottomSheet from '@modules/common/components/BottomSheet'
import Button from '@modules/common/components/Button'
import GradientBackgroundWrapper from '@modules/common/components/GradientBackgroundWrapper'
import InputConfirmationCode from '@modules/common/components/InputConfirmationCode'
import Panel from '@modules/common/components/Panel'
import Text from '@modules/common/components/Text'
import Title from '@modules/common/components/Title'
import Wrapper, { WRAPPER_TYPES } from '@modules/common/components/Wrapper'
import useAccounts from '@modules/common/hooks/useAccounts'
import useAmbireExtension from '@modules/common/hooks/useAmbireExtension'
import useDisableNavigatingBack from '@modules/common/hooks/useDisableNavigatingBack'
import useRequests from '@modules/common/hooks/useRequests'
import useWalletConnect from '@modules/common/hooks/useWalletConnect'
import colors from '@modules/common/styles/colors'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import textStyles from '@modules/common/styles/utils/text'
import HardwareWalletSelectConnection from '@modules/hardware-wallet/components/HardwareWalletSelectConnection'
import SignActions from '@modules/sign-message/components/SignActions'
import useSignMessage from '@modules/sign-message/hooks/useSignMessage'
import { UseSignMessageProps } from '@modules/sign-message/hooks/useSignMessage/types'
import { errorCodes } from '@web/constants/errors'

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

const SignScreenScreen = ({ navigation }: any) => {
  const { t } = useTranslation()
  const { account } = useAccounts()
  const { connections } = useWalletConnect()
  const { everythingToSign, resolveMany } = useRequests()
  const { isTempExtensionPopup } = useAmbireExtension()

  const { handleSubmit, setValue, watch } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      code: ''
    }
  })

  if (isTempExtensionPopup) {
    navigation.navigate = () => window.close()
    navigation.goBack = () => window.close()
  }

  const resolve = (outcome: any) => resolveMany([everythingToSign[0].id], outcome)

  useDisableNavigatingBack(navigation)

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
    openBottomSheetHardwareWallet
  })

  const connection = useMemo(
    () => connections?.find(({ uri }: any) => uri === msgToSign?.wcUri),
    [connections, msgToSign?.wcUri]
  )
  const dApp = connection ? connection?.session?.peerMeta || null : null

  const prevToSign = usePrevious(msgToSign || {})

  if (!Object.keys(msgToSign || {}).length && Object.keys(prevToSign || {}).length) {
    navigation?.goBack()
  }

  if (!msgToSign || !account) return null

  if (typeDataErr) {
    return (
      <Wrapper>
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
    )
  }

  return (
    <>
      <GradientBackgroundWrapper>
        <Wrapper type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW} extraHeight={180}>
          <Title style={[textStyles.center, spacings.mbTy]} hasBottomSpacing={false}>
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
            {!!dApp && (
              <View style={[spacings.mbTy, flexboxStyles.directionRow]}>
                {!!dApp.icons?.[0] && (
                  <Image source={{ uri: dApp.icons[0] }} style={styles.image} />
                )}
                <Text style={flexboxStyles.flex1} fontSize={14}>
                  {t('{{name}} is requesting your signature.', { name: dApp.name })}
                </Text>
              </View>
            )}
            {!dApp && (
              <Text style={spacings.mbTy}>{t('A dApp is requesting your signature.')}</Text>
            )}
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
      </GradientBackgroundWrapper>
      <BottomSheet
        id="sign"
        closeBottomSheet={closeBottomSheetQickAcc}
        onClosed={() => setLoading(false)}
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
