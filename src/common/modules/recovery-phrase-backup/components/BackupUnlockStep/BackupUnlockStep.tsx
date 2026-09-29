import React, { useCallback, useState } from 'react'
import { View, ViewStyle } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import EditPenIcon from '@common/assets/svg/EditPenIcon'
import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { DEV_PREFILLED_PASSWORD, isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useBiometrics from '@common/hooks/useBiometrics'
import useBiometricsAvailability from '@common/hooks/useBiometricsAvailability'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

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
  const { getBiometricsSecret } = useBiometrics()
  const { canUnlockWithBiometrics, BiometricsIcon } = useBiometricsAvailability()
  const [password, setPassword] = useState(DEV_PREFILLED_PASSWORD)
  const [hasSwitchedToPassword, setHasSwitchedToPassword] = useState(false)

  // Biometrics are offered first when set up, but the password stays reachable, because
  // the prompt can be unavailable (Firefox popups) or keep failing on a given device.
  const isUsingBiometrics = canUnlockWithBiometrics && !hasSwitchedToPassword

  const handlePasswordChange = useCallback(
    (value: string) => {
      setPassword(value)
      onPasswordChange()
    },
    [onPasswordChange]
  )

  const handleSwitchToPassword = useCallback(() => setHasSwitchedToPassword(true), [])

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
      // A failed or cancelled prompt resolves to null instead of throwing, so getting here
      // means something unexpected broke and the user is left without a way in
      console.error('Recovery phrase backup: biometrics authentication failed', error)
      captureException(error)
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
        {!isUsingBiometrics && (
          <InputPassword
            testID="backup-recovery-phrase-password-field"
            placeholder={t('Enter your password')}
            value={password}
            onChangeText={handlePasswordChange}
            isValid={isValidPassword(password)}
            error={unlockErrorMessage}
            onSubmitEditing={handleStartWithPassword}
            containerStyle={[spacings.mbXl as ViewStyle, common.fullWidth]}
            // The sheet itself is on primaryBackground, so the field needs to stand out from it
            backgroundColor={theme.secondaryBackground}
          />
        )}
        <Button
          testID="backup-recovery-phrase-start-button"
          text={isUnlocking ? t('Unlocking...') : t('Start')}
          size="large"
          hasBottomSpacing={false}
          disabled={isUnlocking || (!isUsingBiometrics && !isValidPassword(password))}
          onPress={isUsingBiometrics ? handleStartWithBiometrics : handleStartWithPassword}
          childrenPosition="left"
          style={common.fullWidth}
        >
          {!!isUsingBiometrics && (
            <BiometricsIcon width={24} height={24} color="#fff" style={spacings.mrTy} />
          )}
        </Button>
        {!!isUsingBiometrics && (
          <Button
            testID="backup-recovery-phrase-use-password-button"
            text={t('Unlock with password')}
            type="secondary"
            size="large"
            hasBottomSpacing={false}
            disabled={isUnlocking}
            onPress={handleSwitchToPassword}
            style={[spacings.mtSm, common.fullWidth]}
          />
        )}
      </View>
    </View>
  )
}

export default React.memo(BackupUnlockStep)
