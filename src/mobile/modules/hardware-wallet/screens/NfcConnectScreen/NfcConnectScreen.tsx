import React, { useCallback, useEffect, useRef, useState } from 'react'
import { View } from 'react-native'

import NfcIcon from '@common/assets/svg/NfcIcon'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { NfcWalletConfigs } from '@common/modules/hardware-wallets/nfc/wallets'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import useNfcCardSession from '@mobile/modules/hardware-wallet/hooks/useNfcCardSession'
import keycardNfcService from '@mobile/services/keycard/keycardNfcService'

// Matches the QR scanner surface, so both connect screens read the same
const NFC_ICON_SIZE = 280

// Keycard is the only supported card, so the copy can name it. Once a second card
// is added, the one picked in the selector must be passed to this screen instead.
const [{ label: CARD_LABEL }] = NfcWalletConfigs

const NfcConnectScreen = () => {
  const { t } = useTranslation()
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
      setError(
        t('This phone cannot read NFC cards, so a {{cardLabel}} cannot be imported on it.', {
          cardLabel: CARD_LABEL
        })
      )
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

      setIsSubmitting(true)
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_NFC_WALLET',
        params: { payload: exportedKey }
      })
    } catch (e: any) {
      setError(
        e?.message ||
          t('Could not read your {{cardLabel}}. Please try again.', { cardLabel: CARD_LABEL })
      )
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
    if (step === 'awaiting-tap') return t('Waiting for {{cardLabel}}...', { cardLabel: CARD_LABEL })
    if (isBusy) return t('Reading {{cardLabel}}...', { cardLabel: CARD_LABEL })

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
        title={t('Connect {{cardLabel}}', { cardLabel: CARD_LABEL })}
      >
        <Text fontSize={14} style={[spacings.mbSm, { textAlign: 'center' }]}>
          {t('Tap your {{cardLabel}} on the back of your phone to import its accounts.', {
            cardLabel: CARD_LABEL
          })}
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

        {isNfcOff && (
          <Alert
            type="warning"
            size="sm"
            title={t('NFC is turned off. Turn it on to use your {{cardLabel}}.', {
              cardLabel: CARD_LABEL
            })}
          />
        )}

        {!!error && !isNfcOff && <Alert type="error" size="sm" title={error} />}
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(NfcConnectScreen)
