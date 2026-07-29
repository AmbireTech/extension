import React, { useCallback, useState } from 'react'
import { View } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import FaceIDIcon from '@common/assets/svg/FaceIDIcon'
import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { isDev, isMobile, isTesting, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { DEVICE_SUPPORTED_AUTH_TYPES } from '@common/contexts/biometricsContext/constants'
import useBiometrics from '@common/hooks/useBiometrics'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { DEFAULT_KEYSTORE_PASSWORD_DEV } from '@env'

type Props = {
  isUnlocking: boolean
  unlockErrorMessage: string
  onUnlock: (secretId: 'password' | 'biometrics', secret: string) => void
  onPasswordChange: () => void
}

const BackupUnlockStep = ({
  isUnlocking,
  unlockErrorMessage,
  onUnlock,
  onPasswordChange
}: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { hasBiometricsSecret } = useController('KeystoreController').state
  const { getBiometricsSecret, deviceSupportedAuthTypes } = useBiometrics()
  const [password, setPassword] = useState(
    isDev && !isTesting ? (DEFAULT_KEYSTORE_PASSWORD_DEV ?? '') : ''
  )

  const canUseBiometrics = isMobile && hasBiometricsSecret
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

  const handleStartWithPassword = useCallback(() => {
    if (!isValidPassword(password)) return

    onUnlock('password', password)
  }, [onUnlock, password])

  const handleStartWithBiometrics = useCallback(async () => {
    try {
      const biometricsSecret = await getBiometricsSecret()
      if (!biometricsSecret) return

      onUnlock('biometrics', biometricsSecret)
    } catch (error) {
      // The device already told the user that the authentication failed or was cancelled
      console.error('Recovery phrase backup: biometrics authentication failed', error)
    }
  }, [getBiometricsSecret, onUnlock])

  return (
    <View style={flexbox.flex1}>
      <View style={[flexbox.alignCenter, spacings.mbXl]}>
        <EditPenIcon width={32} height={32} color={theme.secondaryText} style={spacings.mbMd} />
        <Text weight="semiBold" fontSize={16} style={[text.center, spacings.mbTy]}>
          {t('Prepare to write down your recovery phrase')}
        </Text>
        <Text fontSize={14} appearance="secondaryText" style={text.center}>
          {t('Your recovery phrase is private. Keep it safe and never share it.')}
        </Text>
      </View>

      <View style={[flexbox.flex1, flexbox.justifyEnd, isWeb && flexbox.alignCenter]}>
        {!canUseBiometrics && (
          <InputPassword
            testID="backup-recovery-phrase-password-field"
            placeholder={t('Enter your password')}
            value={password}
            onChangeText={handlePasswordChange}
            isValid={isValidPassword(password)}
            error={unlockErrorMessage}
            onSubmitEditing={handleStartWithPassword}
            containerStyle={spacings.mbXl}
            // The sheet itself is on primaryBackground, so the field needs to stand out from it
            backgroundColor={theme.secondaryBackground}
          />
        )}
        <Button
          testID="backup-recovery-phrase-start-button"
          text={isUnlocking ? t('Unlocking...') : t('Start')}
          size="large"
          hasBottomSpacing={false}
          disabled={isUnlocking || (!canUseBiometrics && !isValidPassword(password))}
          onPress={canUseBiometrics ? handleStartWithBiometrics : handleStartWithPassword}
          childrenPosition="left"
        >
          {!!canUseBiometrics && (
            <BiometricsIcon width={24} height={24} color="#fff" style={spacings.mrTy} />
          )}
        </Button>
      </View>
    </View>
  )
}

export default React.memo(BackupUnlockStep)
