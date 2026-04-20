import React, { useCallback, useEffect, useState } from 'react'
import { Controller } from 'react-hook-form'
import { Image, TouchableOpacity, View } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import FingerprintIcon from '@common/assets/svg/FingerprintIcon'
import InvisibilityIcon from '@common/assets/svg/InvisibilityIcon'
import LockIcon from '@common/assets/svg/LockIcon'
import VisibilityIcon from '@common/assets/svg/VisibilityIcon'
import Button from '@common/components/Button'
import ButtonWithLoader from '@common/components/ButtonWithLoader/ButtonWithLoader'
import FatToggle from '@common/components/FatToggle'
import {
  createGlobalTooltipDataSet,
  GLOBAL_TOOLTIP_REFRESH_EVENT
} from '@common/components/GlobalTooltip'
import InputPassword from '@common/components/InputPassword'
import LayoutWrapper from '@common/components/LayoutWrapper'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useBiometrics from '@common/hooks/useBiometrics'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useKeyStoreUnlock from '@common/modules/keystore/hooks/useKeyStoreUnlock'
import backgroundImage from '@common/modules/keystore/images/background.png'
import { ROUTES } from '@common/modules/router/constants/common'
import { syncSessionStorage } from '@common/services/storage'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'
import { IS_FIREFOX } from '@web/constants/common'
import { openInternalPageInTab } from '@web/extension-services/background/webapi/tab'
import { SKIP_AUTO_BIOMETRICS_PROMPT_ONCE } from '@web/modules/keystore/constants'

import getStyles from './styles'

const FOOTER_BUTTON_HIT_SLOP = { top: 10, bottom: 15 }

const KeyStoreUnlockScreen = () => {
  const { control, handleSubmit, errors, passwordFieldError, disableSubmit, handleUnlock } =
    useKeyStoreUnlock()
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { styles } = useTheme(getStyles)
  const {
    state: { isPrivacyModeEnabled },
    dispatch: walletStateDispatch
  } = useController('WalletStateController')
  const { hasKeystoreRecovery } = useController('EmailVaultController').state
  const {
    state: { statuses, errorMessage, hasBiometricsSecret },
    dispatch: keystoreDispatch
  } = useController('KeystoreController')
  const { requestWindow } = useController('RequestsController').state
  const { theme } = useTheme()
  const { hasBiometricsHardware, getBiometricsSecret, deviceSupportedAuthTypes } = useBiometrics()
  const { isPopup, isTab } = getUiType()
  const [unlockMethod, setUnlockMethod] = useState<'biometrics' | 'password' | null>(null)
  const [hasAutoPromptedBiometrics, setHasAutoPromptedBiometrics] = useState(false)
  const [isBiometricsPromptPending, setIsBiometricsPromptPending] = useState(false)
  const [didBiometricsUnlockEnterLoading, setDidBiometricsUnlockEnterLoading] = useState(false)
  const [shouldSkipAutoPrompt] = useState(() => {
    const shouldSkip = syncSessionStorage.get(SKIP_AUTO_BIOMETRICS_PROMPT_ONCE) === 'true'
    if (shouldSkip) syncSessionStorage.remove(SKIP_AUTO_BIOMETRICS_PROMPT_ONCE)
    return shouldSkip
  })

  const canUseBiometrics = !!hasBiometricsSecret && !!hasBiometricsHardware

  const shouldUseTabForBiometrics = IS_FIREFOX && isPopup
  const isBiometricsUnlockLoading =
    isBiometricsPromptPending ||
    (unlockMethod === 'biometrics' &&
      didBiometricsUnlockEnterLoading &&
      statuses.unlockWithSecret === 'LOADING')

  const openBiometricsInTab = useCallback(async () => {
    await openInternalPageInTab({
      route: ROUTES.keyStoreUnlock,
      shouldCloseCurrentWindow: !isTab,
      windowId: requestWindow?.windowProps?.createdFromWindowId
    })
  }, [isTab, requestWindow?.windowProps?.createdFromWindowId])

  const handleBiometricsPrompt = useCallback(async () => {
    if (shouldUseTabForBiometrics) {
      await openBiometricsInTab()
      return false
    }

    if (isBiometricsPromptPending || statuses.unlockWithSecret === 'LOADING') return false

    setIsBiometricsPromptPending(true)
    const biometricsSecret = await getBiometricsSecret()
    setIsBiometricsPromptPending(false)

    if (!biometricsSecret) return false

    setDidBiometricsUnlockEnterLoading(true)
    keystoreDispatch({
      type: 'method',
      params: {
        method: 'unlockWithSecret',
        args: ['biometrics', biometricsSecret]
      }
    })

    return true
  }, [
    getBiometricsSecret,
    isBiometricsPromptPending,
    keystoreDispatch,
    openBiometricsInTab,
    shouldUseTabForBiometrics,
    statuses.unlockWithSecret
  ])

  // Refresh tooltip content when privacy mode changes while tooltip is active
  useEffect(() => {
    if (!isWeb) return

    const event = new CustomEvent(GLOBAL_TOOLTIP_REFRESH_EVENT)
    window.dispatchEvent(event)
  }, [isPrivacyModeEnabled])

  useEffect(() => {
    if (unlockMethod) return

    setUnlockMethod(canUseBiometrics ? 'biometrics' : 'password')
  }, [canUseBiometrics, unlockMethod])

  useEffect(() => {
    if (
      !canUseBiometrics ||
      unlockMethod !== 'biometrics' ||
      hasAutoPromptedBiometrics ||
      shouldSkipAutoPrompt
    )
      return

    setHasAutoPromptedBiometrics(true)
    handleBiometricsPrompt().catch((e) => {
      console.log('failed to open biometrics prompt', e)
    })
  }, [
    canUseBiometrics,
    handleBiometricsPrompt,
    hasAutoPromptedBiometrics,
    shouldSkipAutoPrompt,
    unlockMethod
  ])

  useEffect(() => {
    if (statuses.unlockWithSecret === 'LOADING') return

    setDidBiometricsUnlockEnterLoading(false)
  }, [statuses.unlockWithSecret])

  return (
    <LayoutWrapper style={styles.panel}>
      <View
        style={{
          height: 324,
          width: '100%',
          ...spacings.phSm,
          marginBottom: 56
        }}
      >
        <View
          style={{
            width: '100%',
            height: '100%',
            borderRadius: BORDER_RADIUS_PRIMARY,
            overflow: 'hidden',
            ...flexbox.center
          }}
        >
          <Image
            source={{ uri: backgroundImage }}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              objectFit: 'fill',
              top: 0,
              left: 0,
              zIndex: -1
            }}
          />
          <View
            style={[
              { width: '100%' },
              flexbox.directionRow,
              flexbox.justifySpaceBetween,
              flexbox.alignCenter,
              spacings.phSm,
              spacings.mb3Xl
            ]}
          >
            <View
              dataSet={createGlobalTooltipDataSet({
                id: `privacy-mode`,
                content: t(`Balances: ${isPrivacyModeEnabled ? 'Hidden' : 'Visible'}`)
              })}
            >
              <FatToggle
                isOn={!isPrivacyModeEnabled}
                onToggle={() =>
                  walletStateDispatch({
                    type: 'method',
                    params: {
                      method: 'togglePrivacyMode',
                      args: []
                    }
                  })
                }
                width={44}
                height={24}
                style={spacings.mr0}
              >
                {!isPrivacyModeEnabled ? (
                  <VisibilityIcon width={18} height={18} />
                ) : (
                  <InvisibilityIcon width={18} height={18} />
                )}
              </FatToggle>
            </View>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <Text fontSize={20} weight="semiBold" color="#fff" appearance="primaryText">
                {t('Welcome Back')}
              </Text>
              <LockIcon width={24} height={24} color="#fff" style={spacings.mlTy} />
            </View>
            <View style={{ width: 44, height: 24 }} />
          </View>
          <AmbireLogoWithBackgroundAndLogotype color="#fff" style={spacings.mbXl} />
          <Text weight="medium" color="#B9BFC9" style={text.center}>
            {t('Easy and secure self-custody for the\nEthereum ecosystem')}
          </Text>
        </View>
      </View>
      <View style={styles.container}>
        {unlockMethod === 'biometrics' && canUseBiometrics && (
          <>
            <ButtonWithLoader
              type="primary"
              style={{ width: '100%', marginBottom: 0 }}
              isLoading={isBiometricsUnlockLoading}
              text="Unlock with biometrics"
              disabled={isBiometricsUnlockLoading}
              onPress={() => {
                handleBiometricsPrompt().catch((e) => {
                  addToast(`failed to open biometrics prompt`)
                  console.log('failed to open biometrics prompt', e)
                })
              }}
              icon={
                <FingerprintIcon
                  width={20}
                  height={20}
                  color={theme.primaryText}
                  style={spacings.mrSm}
                />
              }
              childrenPosition="left"
            />
            <Button
              type="secondary"
              style={{ width: '100%', marginTop: 12, marginBottom: 0 }}
              hasBottomSpacing={false}
              text={t('Unlock with password')}
              disabled={isBiometricsUnlockLoading}
              onPress={() => setUnlockMethod('password')}
            />
          </>
        )}

        {unlockMethod === 'password' && (
          <>
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <InputPassword
                  testID="passphrase-field"
                  onBlur={onBlur}
                  placeholder={t('Enter your password')}
                  autoFocus={isWeb}
                  inputStyle={{ height: 54 }} // 56-2px border
                  inputWrapperStyle={{ backgroundColor: theme.secondaryBackground, height: 56 }}
                  onChangeText={(val: string) => {
                    onChange(val)
                    if (errorMessage) {
                      keystoreDispatch({
                        type: 'method',
                        params: {
                          method: 'resetErrorState',
                          args: []
                        }
                      })
                    }
                  }}
                  isValid={!errors.password && isValidPassword(value)}
                  value={value}
                  onSubmitEditing={handleSubmit((data) => handleUnlock(data))}
                  error={passwordFieldError}
                  containerStyle={{ ...spacings.mb, width: '100%' }}
                />
              )}
              name="password"
            />
            <Button
              testID="button-unlock"
              disabled={disableSubmit}
              style={{ width: '100%', marginBottom: 0 }}
              text={statuses.unlockWithSecret === 'LOADING' ? t('Unlocking...') : t('Unlock')}
              onPress={handleSubmit((data) => handleUnlock(data))}
            />

            {canUseBiometrics && (
              <Button
                type="secondary"
                style={{ width: '100%', marginTop: 12, marginBottom: 0 }}
                hasBottomSpacing={false}
                text="Unlock with biometrics"
                onPress={() => {
                  handleBiometricsPrompt().catch((e) => {
                    addToast(`failed to open biometrics prompt`)
                    console.log('failed to open biometrics prompt', e)
                  })
                }}
                childrenPosition="left"
              >
                <FingerprintIcon
                  width={20}
                  height={20}
                  color={theme.primaryText}
                  style={spacings.mrSm}
                />
              </Button>
            )}

            {hasKeystoreRecovery && (
              <TouchableOpacity
                onPress={() =>
                  openInternalPageInTab({
                    route: ROUTES.keyStoreEmailRecovery,
                    shouldCloseCurrentWindow: !getUiType().isTab,
                    windowId: requestWindow?.windowProps?.createdFromWindowId
                  })
                }
                style={spacings.mtXl}
                hitSlop={FOOTER_BUTTON_HIT_SLOP}
              >
                <Text weight="medium" appearance="secondaryText" fontSize={14} underline>
                  {t('Forgot extension password?')}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(KeyStoreUnlockScreen)
