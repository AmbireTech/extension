import React, { useCallback, useState } from 'react'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { SvgProps } from 'react-native-svg'

import { isValidPassword } from '@ambire-common/services/validations'
import BiometricsPrompt, { SwitchToBiometricsButton } from '@common/components/BiometricsPrompt'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

export type SigningAuthProps = {
  title: string
  BiometricsIcon: React.FC<SvgProps>
  /** One short sentence on why the confirmation is being asked for. */
  reason: string
  isUsingBiometrics: boolean
  canUseBiometrics: boolean
  isVerifying: boolean
  errorMessage: string
  onConfirmWithPassword: (password: string) => void
  onConfirmWithBiometrics: () => void
  /** Starts the ceremony a moment after the sheet is up, rather than the instant it appears. */
  onAutoPromptBiometrics: () => void
  onCancelAutoPrompt: () => void
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
  title,
  BiometricsIcon,
  reason,
  isUsingBiometrics,
  canUseBiometrics,
  isVerifying,
  errorMessage,
  onConfirmWithPassword,
  onConfirmWithBiometrics,
  onAutoPromptBiometrics,
  onCancelAutoPrompt,
  onSwitchToPassword,
  onPasswordChange
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [password, setPassword] = useState('')
  // Focusing while the sheet is still animating shifts the layout under it, so the field waits
  // for the sheet to be up. Web has no such wait - it keeps the plain `autoFocus`.
  const [hasSheetOpened, setHasSheetOpened] = useState(false)

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

  // The prompt follows the sheet rather than arriving with it, so the user can read what they
  // are being asked before the operating system covers it. `onOpen` rather than `onOpened`,
  // because the web sheet only wires the former.
  const handleOpen = useCallback(() => {
    if (!isUsingBiometrics) return

    onAutoPromptBiometrics()
  }, [isUsingBiometrics, onAutoPromptBiometrics])

  const handleOpened = useCallback(() => setHasSheetOpened(true), [])

  const handleClosed = useCallback(() => {
    onCancelAutoPrompt()
    setPassword('')
    setHasSheetOpened(false)
  }, [onCancelAutoPrompt])

  return (
    <BottomSheet
      id="signing-auth-bottom-sheet"
      type={isWeb ? 'modal' : 'bottom-sheet'}
      sheetRef={sheetRef}
      closeBottomSheet={onCancel}
      onBackdropPress={onCancel}
      onOpen={handleOpen}
      onOpened={handleOpened}
      onClosed={handleClosed}
      adjustToContentHeight
      style={isWeb ? { maxWidth: 432 } : undefined}
    >
      <ModalHeader handleClose={onCancel} title={title} />
      <Text fontSize={14} appearance="secondaryText" style={[text.center, spacings.mbLg]}>
        {reason}
      </Text>

      {isUsingBiometrics ? (
        <BiometricsPrompt
          BiometricsIcon={BiometricsIcon}
          isVerifying={isVerifying}
          errorMessage={errorMessage}
          onConfirm={handleConfirmWithBiometrics}
          onSwitchToPassword={onSwitchToPassword}
        />
      ) : (
        <View>
          <InputPassword
            testID="signing-auth-password-field"
            placeholder={t('Enter your password')}
            value={password}
            autoFocus={isWeb || hasSheetOpened}
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
            <SwitchToBiometricsButton
              BiometricsIcon={BiometricsIcon}
              isVerifying={isVerifying}
              onPress={handleConfirmWithBiometrics}
            />
          )}
        </View>
      )}
    </BottomSheet>
  )
}

export default React.memo(SigningAuthBottomSheet)
