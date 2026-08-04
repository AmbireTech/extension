import { useCallback, useEffect, useRef, useState } from 'react'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { NfcWalletConfigs } from '@common/modules/hardware-wallets/nfc/wallets'
import { ROUTES } from '@common/modules/router/constants/common'
import keycardNfcService, { CANCELLED_MESSAGE } from '@mobile/services/keycard/keycardNfcService'

const [{ label: CARD_LABEL }] = NfcWalletConfigs

/**
 * Reads the card's extended public key and hands it to the account picker. The tap
 * prompt and the PIN prompt are shown by the globally mounted NfcCardSessionModal,
 * so the import runs without leaving the screen it was started from.
 */
const useNfcAccountImport = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { dispatch } = useControllersMiddleware()
  const { goToNextRoute, isOnboardingRoute } = useOnboardingNavigation()
  const { initParams, type } = useController('AccountPickerController').state

  const [isSubmitting, setIsSubmitting] = useState(false)
  // Guards against a second scan being started while one is already running
  const isScanningRef = useRef(false)

  const scanCard = useCallback(async () => {
    if (isScanningRef.current) return

    if (!(await keycardNfcService.isSupported())) {
      addToast(
        t('This phone cannot read NFC cards, so a {{cardLabel}} cannot be imported on it.', {
          cardLabel: CARD_LABEL
        }),
        { type: 'error' }
      )
      return
    }

    if (!(await keycardNfcService.isEnabled())) {
      addToast(
        t('NFC is turned off. Turn it on to use your {{cardLabel}}.', { cardLabel: CARD_LABEL }),
        { type: 'error' }
      )
      await keycardNfcService.openNfcSettings()
      return
    }

    isScanningRef.current = true

    try {
      const exportedKey = await keycardNfcService.exportAccountKey()

      setIsSubmitting(true)
      dispatch({
        type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_NFC_WALLET',
        params: { payload: exportedKey }
      })
    } catch (e: any) {
      // Backing out of the card session is not a failure worth reporting
      if (e?.message === CANCELLED_MESSAGE) return

      addToast(
        e?.message ||
          t('Could not read your {{cardLabel}}. Please try again.', { cardLabel: CARD_LABEL }),
        { type: 'error' }
      )
    } finally {
      isScanningRef.current = false
    }
  }, [addToast, dispatch, t])

  // Keyed off the durable account picker state rather than the transient SUCCESS
  // status, which can be collapsed away before the UI ever renders it on mobile.
  useEffect(() => {
    if (!isSubmitting || !initParams || type !== 'nfc') return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSubmitting(false)
    // Outside onboarding (the account select and settings screens) there is no next
    // route to walk to, so the picker is named explicitly.
    goToNextRoute(isOnboardingRoute ? undefined : ROUTES.accountPicker)
  }, [isSubmitting, initParams, type, goToNextRoute, isOnboardingRoute])

  return { scanCard }
}

export default useNfcAccountImport
