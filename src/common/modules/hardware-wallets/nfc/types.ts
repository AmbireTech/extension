import { NfcWalletType } from '@ambire-common/interfaces/keystore'

/**
 * The steps an NFC card session goes through. The session is driven by the
 * native NFC service (not by a controller), because the card credentials must
 * never leave the React Native context.
 */
export type NfcSessionStep =
  | 'idle'
  | 'awaiting-pin'
  | 'awaiting-pairing-password'
  | 'awaiting-tap'
  | 'communicating'

export type NfcSessionPurpose = 'import' | 'sign'

export type NfcSessionState = {
  step: NfcSessionStep
  purpose: NfcSessionPurpose | null
  error: string | null
  /** How many PIN attempts the card has left, when it has just reported one. */
  pinAttemptsLeft: number | null
}

export type NfcSignature = { r: string; s: string; v: number }

export type NfcExportedKey = {
  /** BIP32 extended public key (xpub) of the exported account-level path. */
  extendedPublicKey: string
  /** The path the extended public key was exported from. */
  hdPath: string
  /** Identifies the master key on the card, so signing can verify the right card was tapped. */
  keyUid: string
}

export type NfcWalletConfigEntry = {
  type: NfcWalletType
  label: string
  tutorialUrl?: string
}
