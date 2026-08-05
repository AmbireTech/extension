import { useCallback, useEffect, useRef, useState } from 'react'

import { NfcWalletType } from '@ambire-common/interfaces/keystore'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { NFC_CANCELLED_MESSAGE } from '@common/modules/hardware-wallets/nfc/consts'
import { NfcWalletRegistry } from '@common/modules/hardware-wallets/nfc/wallets'
import { ROUTES } from '@common/modules/router/constants/common'
import { getNfcCardService } from '@mobile/services/nfc'

/**
 * Reads the card's extended public key and hands it to the account picker. The tap
 * prompt and the PIN prompt are shown by the globally mounted NfcCardSessionModal,
 * so the import runs without leaving the screen it was started from.
 *
 * Every card is imported through here: `scanCard` is given the card the user picked
 * and the talking is done by that card's own service.
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

  const scanCard = useCallback(
    async (nfcWalletType: NfcWalletType) => {
      if (isScanningRef.current) return

      const cardService = getNfcCardService(nfcWalletType)
      const { label: cardLabel } = NfcWalletRegistry[nfcWalletType]

      if (!(await cardService.isSupported())) {
        addToast(
          t('This phone cannot read NFC cards, so a {{cardLabel}} cannot be imported on it.', {
            cardLabel
          }),
          { type: 'error' }
        )
        return
      }

      if (!(await cardService.isEnabled())) {
        addToast(t('NFC is turned off. Turn it on to use your {{cardLabel}}.', { cardLabel }), {
          type: 'error'
        })
        await cardService.openNfcSettings()
        return
      }

      isScanningRef.current = true

      try {
        const exportedKey = await cardService.exportAccountKey()

        setIsSubmitting(true)
        dispatch({
          type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_NFC_WALLET',
          params: { payload: exportedKey }
        })
      } catch (e: any) {
        // Backing out of the card session is not a failure worth reporting
        if (e?.message === NFC_CANCELLED_MESSAGE) return

        addToast(
          e?.message || t('Could not read your {{cardLabel}}. Please try again.', { cardLabel }),
          { type: 'error' }
        )
      } finally {
        isScanningRef.current = false
      }
    },
    [addToast, dispatch, t]
  )

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
