import { NfcWalletType } from '@ambire-common/interfaces/keystore'
import { NfcCardService } from '@common/modules/hardware-wallets/nfc/types'
import keycardNfcService from '@mobile/services/nfc/keycard/keycardNfcService'

/**
 * The native service of every supported card, keyed by card. Each card has its own
 * applet, SDK and session flow, so the card specifics live in its service and the
 * generic hooks, UI and the worker-side NfcController pick one by `NfcWalletType`.
 */
export const nfcCardServices: Record<NfcWalletType, NfcCardService> = {
  keycard: keycardNfcService
}

export const getNfcCardService = (nfcWalletType: NfcWalletType): NfcCardService => {
  const service = nfcCardServices[nfcWalletType]

  if (!service) throw new Error(`This build cannot talk to ${nfcWalletType} cards.`)

  return service
}

/**
 * The card currently in a session, if any. There is a single NFC radio, so at most
 * one card can be talking to the app at a time - which is what lets the globally
 * mounted session modal show whichever card the user started.
 */
export const getActiveNfcCardService = (): NfcCardService | null =>
  Object.values(nfcCardServices).find((service) => service.getState().step !== 'idle') || null
