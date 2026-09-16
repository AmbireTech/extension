import React, { useCallback, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { isValidPassword } from '@ambire-common/services/validations'
import FaceIDIcon from '@common/assets/svg/FaceIDIcon'
import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { DEVICE_SUPPORTED_AUTH_TYPES } from '@common/contexts/biometricsContext/constants'
import useBiometrics from '@common/hooks/useBiometrics'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

const BIOMETRICS_BUTTON_SIZE = 80

export type SigningAuthProps = {
  /** One short sentence on why the confirmation is being asked for. */
  reason: string
  isUsingBiometrics: boolean
  canUseBiometrics: boolean
  isVerifying: boolean
  errorMessage: string
  onConfirmWithPassword: (password: string) => void
  onConfirmWithBiometrics: () => void
  onSwitchToPassword: () => void
  onPasswordChange: () => void
}

type Props = SigningAuthProps & {
  sheetRef: React.RefObject<Modalize>
  onCancel: () => void
}

const SigningAuthBottomSheet = ({
  sheetRef,
  onCancel,
  reason,
  isUsingBiometrics,
  canUseBiometrics,
  isVerifying,
  errorMessage,
  onConfirmWithPassword,
  onConfirmWithBiometrics,
  onSwitchToPassword,
  onPasswordChange
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { deviceSupportedAuthTypes } = useBiometrics()
  const [password, setPassword] = useState('')

  const BiometricsIcon = deviceSupportedAuthTypes.includes(
    DEVICE_SUPPORTED_AUTH_TYPES.FACIAL_RECOGNITION
  )
    ? FaceIDIcon
    : FingerprintIcon

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value)
      onPasswordChange()
    },
    [onPasswordChange]
  )

  const handleConfirmWithPassword = useCallback(() => {
    if (!isValidPassword(password) || isVerifying) return

    onConfirmWithPassword(password)
  }, [isVerifying, onConfirmWithPassword, password])

  const handleConfirmWithBiometrics = useCallback(() => {
    onConfirmWithBiometrics()
  }, [onConfirmWithBiometrics])

  // The prompt is what the user expects to see straight away, the same way the unlock screen
  // behaves on both platforms. `onOpen` rather than `onOpened`, because the web sheet only
  // wires the former.
  const handleOpen = useCallback(() => {
    if (!isUsingBiometrics) return

    onConfirmWithBiometrics()
  }, [isUsingBiometrics, onConfirmWithBiometrics])

  const handleClosed = useCallback(() => setPassword(''), [])

  return (
    <BottomSheet
      id="signing-auth-bottom-sheet"
      type={isWeb ? 'modal' : 'bottom-sheet'}
      sheetRef={sheetRef}
      closeBottomSheet={onCancel}
      onBackdropPress={onCancel}
      onOpen={handleOpen}
      onClosed={handleClosed}
      adjustToContentHeight
      style={isWeb ? { maxWidth: 432 } : undefined}
    >
      <ModalHeader handleClose={onCancel} title={t('Signing authentication')} />
      <Text fontSize={14} appearance="secondaryText" style={[text.center, spacings.mbLg]}>
        {reason}
      </Text>

      {isUsingBiometrics ? (
        <View style={flexbox.alignCenter}>
          <Pressable
            testID="signing-auth-biometrics-button"
            onPress={handleConfirmWithBiometrics}
            disabled={isVerifying}
            style={{
              width: BIOMETRICS_BUTTON_SIZE,
              height: BIOMETRICS_BUTTON_SIZE,
              borderRadius: BIOMETRICS_BUTTON_SIZE / 2,
              backgroundColor: theme.secondaryBackground,
              ...flexbox.center,
              ...spacings.mbLg
            }}
          >
            <BiometricsIcon width={56} height={56} color={theme.iconPrimary} />
          </Pressable>
          {!!errorMessage && (
            <Text fontSize={12} appearance="errorText" style={[text.center, spacings.mbSm]}>
              {errorMessage}
            </Text>
          )}
          <Button
            testID="signing-auth-use-password-button"
            text={t('Confirm with password')}
            type="secondary"
            size="large"
            hasBottomSpacing={false}
            disabled={isVerifying}
            onPress={onSwitchToPassword}
            style={common.fullWidth}
          />
        </View>
      ) : (
        <View>
          <InputPassword
            testID="signing-auth-password-field"
            placeholder={t('Enter your password')}
            value={password}
            autoFocus={isWeb}
            onChangeText={handlePasswordChange}
            isValid={isValidPassword(password)}
            error={errorMessage}
            onSubmitEditing={handleConfirmWithPassword}
            containerStyle={spacings.mbLg}
            backgroundColor={theme.secondaryBackground}
          />
          <ButtonWithLoader
            testID="signing-auth-confirm-button"
            text={t('Confirm')}
            size="large"
            hasBottomSpacing={false}
            isLoading={isVerifying}
            disabled={isVerifying || !isValidPassword(password)}
            onPress={handleConfirmWithPassword}
          />
          {!!canUseBiometrics && (
            <Button
              testID="signing-auth-use-biometrics-button"
              text={t('Confirm with biometrics')}
              type="secondary"
              size="large"
              hasBottomSpacing={false}
              disabled={isVerifying}
              onPress={handleConfirmWithBiometrics}
              childrenPosition="left"
              style={spacings.mtSm}
            >
              <BiometricsIcon
                width={24}
                height={24}
                color={theme.primaryText}
                style={spacings.mrTy}
              />
            </Button>
          )}
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(SigningAuthBottomSheet)
