import { NfcWalletType } from '@ambire-common/interfaces/keystore'

/**
 * The steps an NFC card session goes through. The session is driven by the
 * native NFC service (not by a controller), because the card credentials must
 * never leave the React Native context.
 */
export type NfcSessionStep = 'idle' | 'awaiting-pin' | 'awaiting-tap' | 'communicating'

export type NfcSessionPurpose = 'import' | 'sign'

export type NfcSessionState = {
  step: NfcSessionStep
  purpose: NfcSessionPurpose | null
  error: string | null
  /** How many PIN attempts the card has left, when it has just reported one. */
  pinAttemptsLeft: number | null
}

export type NfcSignature = { r: string; s: string; v: number }

export type NfcSignHashParams = {
  hashHex: string
  path: string
  expectedKeyUid: string
}

/** What the signer asks the controller for: the same, plus the card to ask. */
export type NfcControllerSignHashParams = NfcSignHashParams & { nfcWalletType: NfcWalletType }

export type NfcExportedKey = {
  /** BIP32 extended public key (xpub) of the exported account-level path. */
  extendedPublicKey: string
  /** The path the extended public key was exported from. */
  hdPath: string
  /** Identifies the master key on the card, so signing can verify the right card was tapped. */
  keyUid: string
  nfcWalletType: NfcWalletType
}

export type NfcWalletConfigEntry = {
  type: NfcWalletType
  label: string
  tutorialUrl?: string
}

export interface NfcCardService {
  nfcWalletType: NfcWalletType
  /** Whether the phone can read NFC cards at all. */
  isSupported: () => Promise<boolean>
  /** Whether NFC is currently turned on (a setting the user has on Android only). */
  isEnabled: () => Promise<boolean>
  openNfcSettings: () => Promise<void>
  subscribe: (listener: (state: NfcSessionState) => void) => { unsubscribe: () => void }
  getState: () => NfcSessionState
  /** Answers whatever the session is currently asking the user for (a PIN, so far). */
  submitPrompt: (value: string) => void
  cancel: () => void
  /**
   * Mark the start and the end of one account op's signing, so the card can keep the
   * PIN for that long and an op taking several signatures needs a single PIN entry.
   */
  beginPinSession: () => void
  endPinSession: () => void
  /** Reads the account-level extended public key, so accounts can be imported. */
  exportAccountKey: () => Promise<NfcExportedKey>
  signHash: (args: NfcSignHashParams) => Promise<NfcSignature>
}
