import { useCallback, useEffect, useState } from 'react'

import { NfcSessionState } from '@common/modules/hardware-wallets/nfc/types'
import keycardNfcService from '@mobile/services/keycard/keycardNfcService'

/**
 * Exposes the native NFC card session to the UI. The session is owned by the
 * native service (not by a controller), so that the PIN never travels to the
 * worker where the controllers live.
 */
const useNfcCardSession = () => {
  const [state, setState] = useState<NfcSessionState>(keycardNfcService.getState())

  useEffect(() => {
    const subscription = keycardNfcService.subscribe(setState)

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const submitPrompt = useCallback((value: string) => keycardNfcService.submitPrompt(value), [])

  const cancel = useCallback(() => keycardNfcService.cancel(), [])

  return { ...state, submitPrompt, cancel }
}

export default useNfcCardSession
