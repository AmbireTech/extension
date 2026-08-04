import { useCallback, useEffect, useState } from 'react'

import { NfcWalletType } from '@ambire-common/interfaces/keystore'
import { NfcSessionState } from '@common/modules/hardware-wallets/nfc/types'
import { getActiveNfcCardService, nfcCardServices } from '@mobile/services/nfc'

const IDLE_SESSION: NfcSessionState & { nfcWalletType: NfcWalletType | null } = {
  step: 'idle',
  purpose: null,
  error: null,
  pinAttemptsLeft: null,
  nfcWalletType: null
}

const getActiveSession = () => {
  const cardService = getActiveNfcCardService()

  if (!cardService) return IDLE_SESSION

  return { ...cardService.getState(), nfcWalletType: cardService.nfcWalletType }
}

/**
 * Exposes the card session that is currently running to the UI, whichever card
 * started it. A session is owned by its card's native service (not by a controller),
 * so that the PIN never travels to the worker where the controllers live.
 */
const useNfcCardSession = () => {
  const [session, setSession] = useState(getActiveSession)

  useEffect(() => {
    // All supported cards are listened to, because a session can be started by any
    // of them - which one it turned out to be is reported back in the session.
    const subscriptions = Object.values(nfcCardServices).map((cardService) =>
      cardService.subscribe(() => setSession(getActiveSession()))
    )

    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe())
    }
  }, [])

  const submitPrompt = useCallback(
    (value: string) => getActiveNfcCardService()?.submitPrompt(value),
    []
  )

  const cancel = useCallback(() => getActiveNfcCardService()?.cancel(), [])

  return { ...session, submitPrompt, cancel }
}

export default useNfcCardSession
