import { useCallback, useRef } from 'react'

import { NfcWalletType } from '@ambire-common/interfaces/keystore'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import useAccountPickerHardwareInit from '@common/modules/hardware-wallets/hooks/useAccountPickerHardwareInit'
import { NFC_CANCELLED_MESSAGE } from '@common/modules/hardware-wallets/nfc/consts'
import { NfcExportedKey } from '@common/modules/hardware-wallets/nfc/types'
import { NfcWalletRegistry } from '@common/modules/hardware-wallets/nfc/wallets'
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
  const initAccountPicker = useAccountPickerHardwareInit()
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

      let exportedKey: NfcExportedKey
      try {
        exportedKey = await cardService.exportAccountKey()
      } catch (e: any) {
        isScanningRef.current = false
        // Backing out of the card session is not a failure worth reporting
        if (e?.message === NFC_CANCELLED_MESSAGE) return

        addToast(
          e?.message || t('Could not read your {{cardLabel}}. Please try again.', { cardLabel }),
          { type: 'error' }
        )
        return
      }

      try {
        await initAccountPicker({
          type: 'MAIN_CONTROLLER_ACCOUNT_PICKER_INIT_NFC_WALLET',
          params: { payload: exportedKey }
        })
      } catch (error) {
        // The controller reports its own failures, here a new scan only becomes possible again
        console.error('Failed to set the account picker up for the card', error)
      } finally {
        isScanningRef.current = false
      }
    },
    [addToast, initAccountPicker, t]
  )

  return { scanCard }
}

export default useNfcAccountImport
