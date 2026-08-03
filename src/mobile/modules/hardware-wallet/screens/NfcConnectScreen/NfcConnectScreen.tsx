import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import NfcIcon from '@common/assets/svg/NfcIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { isDev } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { NfcWalletConfigs } from '@common/modules/hardware-wallets/nfc/wallets'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import useNfcCardSession from '@mobile/modules/hardware-wallet/hooks/useNfcCardSession'
import keycardNfcService from '@mobile/services/keycard/keycardNfcService'

// Matches the QR scanner surface, so both connect screens read the same
const NFC_ICON_SIZE = 280

const NfcConnectScreen = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { dispatch } = useControllersMiddleware()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { initParams, type } = useController('AccountPickerController').state
  const { step } = useNfcCardSession()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNfcOff, setIsNfcOff] = useState(false)
  // Guards against a second scan being started while one is already running
  const isScanningRef = useRef(false)

  const scanCard = useCallback(async () => {
    if (isScanningRef.current) return

    if (!(await keycardNfcService.isSupported())) {
      setError(t('This phone cannot read NFC cards, so a card cannot be imported on it.'))
      return
    }

    if (!(await keycardNfcService.isEnabled())) {
      setIsNfcOff(true)
      return
    }

    setIsNfcOff(false)
    setError(null)
    isScanningRef.current = true

    try {
      const exportedKey = await keycardNfcService.exportAccountKey()
      if (isDev) console.log('[keycard] account key exported', { keyUid: exportedKey.keyUid })

      setIsSubmitting(true)
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_NFC_WALLET',
        params: { payload: exportedKey }
      })
    } catch (e: any) {
      if (isDev) console.log('[keycard] import failed', e?.message)
      setError(e?.message || t('Could not read the card. Please try again.'))
    } finally {
      isScanningRef.current = false
    }
  }, [dispatch, t])

  // Nothing is started until the user presses Scan, so the NFC prompt never comes
  // up unasked. Leaving the screen mid-session ends it.
  useEffect(() => {
    return () => keycardNfcService.cancel()
  }, [])

  // Only re-checks the setting; scanning still waits for an explicit Scan press.
  const handleTurnOnNfc = useCallback(async () => {
    await keycardNfcService.openNfcSettings()
    setIsNfcOff(!(await keycardNfcService.isEnabled()))
  }, [])

  const handleBackButtonPress = useCallback(() => {
    keycardNfcService.cancel()
    goToPrevRoute()
  }, [goToPrevRoute])

  // Keyed off the durable account picker state rather than the transient SUCCESS
  // status, which can be collapsed away before the UI ever renders it on mobile.
  useEffect(() => {
    if (isSubmitting && initParams && type === 'nfc') {
      setIsSubmitting(false)
      goToNextRoute()
    }
  }, [isSubmitting, initParams, type, goToNextRoute])

  const isBusy = isSubmitting || (step !== 'idle' && step !== 'awaiting-pin')

  const buttonText = (() => {
    if (isNfcOff) return t('Turn on NFC')
    if (isSubmitting) return t('Reading accounts...')
    if (step === 'awaiting-tap') return t('Waiting for card...')
    if (isBusy) return t('Reading card...')

    return t('Scan')
  })()

  return (
    <MobileLayoutContainer
      footer={
        <Button
          text={buttonText}
          disabled={isBusy}
          hasBottomSpacing={false}
          onPress={isNfcOff ? handleTurnOnNfc : scanCard}
        />
      }
    >
      <MobileLayoutWrapperMainContent
        withBackButton
        onBackButtonPress={handleBackButtonPress}
        title={t('Connect card')}
      >
        <Text fontSize={14} style={[spacings.mbSm, { textAlign: 'center' }]}>
          {t('Tap your card on the back of your phone to import its accounts.')}
        </Text>

        <View
          style={[
            flexbox.center,
            {
              width: NFC_ICON_SIZE,
              height: NFC_ICON_SIZE,
              alignSelf: 'center'
            }
          ]}
        >
          <NfcIcon width={NFC_ICON_SIZE * 0.6} height={NFC_ICON_SIZE * 0.6} />
        </View>

        {NfcWalletConfigs.map((wallet) => (
          <View
            key={wallet.type}
            style={[
              flexbox.directionRow,
              flexbox.alignCenter,
              spacings.phSm,
              spacings.pvSm,
              spacings.mbSm,
              {
                backgroundColor: theme.secondaryBackground,
                borderRadius: BORDER_RADIUS_PRIMARY
              }
            ]}
          >
            <Text fontSize={16} weight="medium">
              {wallet.label}
            </Text>
          </View>
        ))}

        {isNfcOff && (
          <Alert
            type="warning"
            size="sm"
            title={t('NFC is turned off. Turn it on to use your card.')}
          />
        )}

        {!!error && !isNfcOff && <Alert type="error" size="sm" title={error} />}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(NfcConnectScreen)
