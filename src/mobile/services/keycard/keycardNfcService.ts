import { Buffer } from 'buffer'
import { Platform } from 'react-native'
import NfcManager, { NfcError, NfcTech } from 'react-native-nfc-manager'

import { APDUResponse } from 'keycard-sdk/dist/apdu-response'
import { ApplicationInfo } from 'keycard-sdk/dist/application-info'
import { BIP32KeyPair } from 'keycard-sdk/dist/bip32key'
import { Commandset } from 'keycard-sdk/dist/commandset'
import type { APDUCommand } from 'keycard-sdk/dist/apdu-command'
import type { CardChannel } from 'keycard-sdk/dist/card-channel'
import {
  CardLoadKeyError,
  CardPairingError,
  CardPinVerificationError,
  KeycardManager,
  KManagerError,
  LOADED
} from 'keycard-sdk/dist/keycard-manager'
import { RecoverableSignature } from 'keycard-sdk/dist/recoverable-signature'

import hexStringToUint8Array from '@ambire-common/utils/hexStringToUint8Array'
import { addHexPrefix } from '@ambire-common/utils/addHexPrefix'
import {
  NfcExportedKey,
  NfcSessionPurpose,
  NfcSessionState,
  NfcSignature
} from '@common/modules/hardware-wallets/nfc/types'
import keycardPairingStorage from '@mobile/services/keycard/keycardPairingStorage'

// All Keycard communication happens HERE, in the React Native context, because
// the NFC radio is a native module the WebView worker (where the controllers run)
// cannot reach. The worker-side NfcController forwards signing to this singleton
// over the message bridge (see WebViewWorker.tsx `keycard.*` cases), while the
// account import flow calls it directly from the connect screen.
//
// The PIN never leaves this file: the UI hands it in through `submitPin` and it is
// wiped as soon as the card session ends. It is never persisted, never sent over
// the bridge and never written to a controller.

/** The account-level path the extended public key is exported from (BIP44 standard). */
export const KEYCARD_ACCOUNT_HD_PATH = "m/44'/60'/0'/0"

/**
 * Android's default IsoDep timeout (~600ms) is too short for the card's key
 * derivation and signing, which makes long taps fail with a transceive error.
 */
const ANDROID_ISO_DEP_TIMEOUT = 5000

/**
 * Whether the card can be tapped before the PIN is asked. Android keeps the tag
 * connected while the app UI stays interactive, so the whole operation is one tap.
 * iOS covers the app with a system sheet for the duration of the NFC session, so
 * there the PIN has to be collected up front.
 */
const IS_TAP_FIRST = Platform.OS === 'android'

const CANCELLED_MESSAGE = 'Card operation cancelled.'

class KeycardCancelledError extends Error {
  constructor() {
    super(CANCELLED_MESSAGE)
  }
}

/** Bridges keycard-sdk's APDU commands onto the NFC transport. */
class NfcCardChannel implements CardChannel {
  connected = false

  async send(cmd: APDUCommand): Promise<APDUResponse> {
    const response = await NfcManager.isoDepHandler.transceive(Array.from(cmd.serialize()))

    return new APDUResponse(new Uint8Array(response))
  }

  isConnected(): boolean {
    return this.connected
  }
}

/**
 * The card returns r and s as minimal integers, so a value with leading zero
 * bytes comes back shorter than 32 bytes. Signatures must be padded back to the
 * full width, otherwise ethers rejects them.
 */
const toSignatureComponentHex = (component: Uint8Array) =>
  addHexPrefix(Buffer.from(component).toString('hex').padStart(64, '0'))

const NO_WALLET_ON_CARD_MESSAGE =
  'There is no wallet on this card yet. Set the card up in the Keycard app first, then import it here.'

const assertCardHasWallet = (keyUid: string) => {
  if (!keyUid) throw new Error(NO_WALLET_ON_CARD_MESSAGE)
}

const assertCardHoldsKey = (keyUid: string, expectedKeyUid: string) => {
  assertCardHasWallet(keyUid)

  if (expectedKeyUid && keyUid !== expectedKeyUid) {
    throw new Error(
      'This card holds a different wallet than the account you are signing with. Please tap the right card.'
    )
  }
}

const isUserCancelledNfcError = (e: any) =>
  e instanceof NfcError.UserCancel || e instanceof KeycardCancelledError

class KeycardNfcService {
  #state: NfcSessionState = {
    step: 'idle',
    purpose: null,
    error: null,
    pinAttemptsLeft: null
  }

  #listeners = new Set<(state: NfcSessionState) => void>()

  /** Resolves the PIN / pairing password the UI is currently being asked for. */
  #pendingPrompt: { resolve: (value: string) => void; reject: (error: Error) => void } | null = null

  #keycardManager = new KeycardManager(keycardPairingStorage)

  #isNfcManagerStarted = false

  #isCancelled = false

  subscribe = (listener: (state: NfcSessionState) => void) => {
    this.#listeners.add(listener)

    return { unsubscribe: () => this.#listeners.delete(listener) }
  }

  getState = (): NfcSessionState => this.#state

  #setState(next: Partial<NfcSessionState>) {
    this.#state = { ...this.#state, ...next }
    this.#listeners.forEach((listener) => listener(this.#state))
  }

  isSupported = async (): Promise<boolean> => {
    try {
      return await NfcManager.isSupported()
    } catch {
      return false
    }
  }

  /** Android only - iOS has no user-facing NFC toggle. */
  isEnabled = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true

    try {
      return await NfcManager.isEnabled()
    } catch {
      return false
    }
  }

  openNfcSettings = async () => {
    if (Platform.OS !== 'android') return

    await NfcManager.goToNfcSetting()
  }

  /** Called by the UI when the user submits the PIN or the pairing password. */
  submitPrompt = (value: string) => {
    const prompt = this.#pendingPrompt
    if (!prompt) return

    this.#pendingPrompt = null
    prompt.resolve(value)
  }

  /** Called by the UI when the user dismisses the card session. */
  cancel = () => {
    const prompt = this.#pendingPrompt
    this.#pendingPrompt = null
    // Cancelling mid-tap surfaces as a plain transport error, so remember the
    // intent and report it as a cancellation rather than a card failure.
    this.#isCancelled = true

    if (prompt) prompt.reject(new KeycardCancelledError())

    // Ends an in-flight tap too (rejects the pending requestTechnology / transceive).
    NfcManager.cancelTechnologyRequest().catch(() => {
      // Nothing to cancel - the session was not open. Not actionable.
    })
  }

  #promptUser(
    step: 'awaiting-pin' | 'awaiting-pairing-password',
    error: string | null = null
  ): Promise<string> {
    this.#setState({ step, error })

    return new Promise<string>((resolve, reject) => {
      this.#pendingPrompt = { resolve, reject }
    })
  }

  async #withCardSession<T>(
    cb: (channel: NfcCardChannel) => Promise<T>,
    // Shown inside the iOS system sheet, which covers our own UI while the session
    // is open, so it is the only guidance the user gets there.
    alertMessage = 'Hold your card against the top of your phone.'
  ): Promise<T> {
    if (!this.#isNfcManagerStarted) {
      await NfcManager.start()
      this.#isNfcManagerStarted = true
    }

    const channel = new NfcCardChannel()

    try {
      this.#setState({ step: 'awaiting-tap', error: null })
      await NfcManager.requestTechnology(NfcTech.IsoDep, { alertMessage })

      if (Platform.OS === 'android') await NfcManager.setTimeout(ANDROID_ISO_DEP_TIMEOUT)

      channel.connected = true
      this.#setState({ step: 'communicating' })

      return await cb(channel)
    } finally {
      channel.connected = false
      await NfcManager.cancelTechnologyRequest().catch(() => {
        // The session may already be closed (card moved away, user cancelled).
      })
    }
  }

  /**
   * Runs one card command: gets the card and the PIN, opens the secure channel and
   * executes `cb`. A wrong PIN or a missing pairing password re-prompts instead of
   * failing, so the user does not have to restart the whole flow.
   *
   * The card is tapped first and the PIN asked once it is on the phone (IS_TAP_FIRST).
   * On iOS that order is impossible: an open NFC session puts a system sheet over the
   * app, so nothing of ours can be typed into until the session ends - there, the PIN
   * is asked before the tap instead.
   */
  async #runOnCard<T>(
    purpose: NfcSessionPurpose,
    cb: (cmdSet: Commandset) => Promise<T>,
    checkCard: (keyUid: string) => void
  ): Promise<T> {
    let pin: string | null = null
    let pairingPassword: string | undefined
    let pinError: string | null = null
    let isCardIdentified = false

    this.#isCancelled = false
    this.#setState({ purpose, error: null, pinAttemptsLeft: null })

    try {
      while (true) {
        if (!IS_TAP_FIRST && !isCardIdentified) {
          // iOS keeps a system sheet over the app for as long as the NFC session
          // is open, so the PIN can only be typed after the session ends - and the
          // card connection ends with it. Hence two taps: this one identifies the
          // card (no PIN needed) so a wrong or empty card is caught before the user
          // types anything, and the one below does the actual work.
          checkCard(await this.#identifyCard())
          isCardIdentified = true
        }

        if (!IS_TAP_FIRST && !pin) pin = await this.#promptUser('awaiting-pin', pinError)

        try {
          const result = await this.#withCardSession(
            async (channel) => {
              // The card stays in the field while the PIN is typed, so this whole
              // operation is a single tap.
              if (!pin) {
                pin = await this.#promptUser('awaiting-pin', pinError)
                this.#setState({ step: 'communicating', error: null })
              }

              const response = await this.#keycardManager.runOnSecureChannel(
                channel,
                LOADED,
                {
                  pin: pin as string,
                  pairingPassword,
                  // Empty lists tell the SDK to skip the card authenticity check, which
                  // needs Keycard's certificate authority keys. Cards running applet 4.0+
                  // are verified by the SDK through their on-card certificate instead.
                  caPublicKeys: [],
                  skipVerificationUID: []
                },
                cb
              )

              if (response.status !== 'success') {
                throw new KManagerError(
                  response.data?.message || 'Card command failed.',
                  response.data?.type,
                  response.data
                )
              }

              return response.data.cbFuncResponse as T
            },
            isCardIdentified ? 'Hold your card again to finish.' : undefined
          )

          this.#setState({ step: 'idle', purpose: null, error: null, pinAttemptsLeft: null })

          return result
        } catch (e: any) {
          if (this.#isCancelled || isUserCancelledNfcError(e)) throw new KeycardCancelledError()

          const attemptsLeft = this.#getPinAttemptsLeft(e)
          if (attemptsLeft !== null && attemptsLeft > 0) {
            pin = null
            pinError = `Wrong PIN. ${attemptsLeft} ${
              attemptsLeft === 1 ? 'attempt' : 'attempts'
            } left before the card locks.`
            this.#setState({ pinAttemptsLeft: attemptsLeft })

            continue
          }

          if (e?.errorCode === CardPairingError && !pairingPassword) {
            pairingPassword = await this.#promptUser('awaiting-pairing-password')

            continue
          }

          throw new Error(this.#getUserFacingError(e))
        }
      }
    } catch (e: any) {
      const message = isUserCancelledNfcError(e) ? CANCELLED_MESSAGE : e?.message
      this.#setState({ step: 'idle', purpose: null, error: null, pinAttemptsLeft: null })

      throw new Error(message || 'Could not talk to your card. Please try again.')
    } finally {
      pin = null
      pairingPassword = undefined
    }
  }

  /**
   * Reads which wallet the tapped card holds. Only SELECT is sent, which needs
   * neither a secure channel nor the PIN.
   */
  async #identifyCard(): Promise<string> {
    const keyUid = await this.#withCardSession(async (channel) => {
      const cmdSet = new Commandset(channel)

      return new ApplicationInfo((await cmdSet.select()).checkOK().data).keyUID
    })

    return keyUid?.length ? Buffer.from(keyUid).toString('hex') : ''
  }

  #getPinAttemptsLeft(e: any): number | null {
    if (e?.errorCode !== CardPinVerificationError) return null

    const attemptsLeft = e?.cardData?.pinRetry

    return typeof attemptsLeft === 'number' ? attemptsLeft : null
  }

  #getUserFacingError(e: any): string {
    if (e?.errorCode === CardPinVerificationError) {
      return 'The card is locked because the PIN was entered wrongly too many times. Unblock it with your PUK code in the Keycard app.'
    }

    if (e?.errorCode === CardLoadKeyError) {
      return 'There is no wallet on this card yet. Set the card up in the Keycard app first, then import it here.'
    }

    if (e?.errorCode === CardPairingError) {
      return 'Could not pair with this card. Check the pairing password, or free up a pairing slot in the Keycard app.'
    }

    if (e instanceof NfcError.Timeout || e?.message?.includes('CardIO Error')) {
      return 'Lost connection to the card. Hold it against your phone until the operation finishes.'
    }

    return e?.message || 'Could not talk to your card. Please try again.'
  }

  /**
   * Exports the account-level extended public key, so every address can be derived
   * without the card. Tapped once, during import.
   */
  exportAccountKey = async (): Promise<NfcExportedKey> => {
    return this.#runOnCard(
      'import',
      async (cmdSet) => {
        const keyUid = cmdSet.applicationInfo?.keyUID
        const tappedKeyUid = keyUid?.length ? Buffer.from(keyUid).toString('hex') : ''
        assertCardHasWallet(tappedKeyUid)

        const exportedKey = (
          await cmdSet.exportExtendedKey(0, KEYCARD_ACCOUNT_HD_PATH, false)
        ).checkOK().data

        return {
          extendedPublicKey: BIP32KeyPair.extendedKey(exportedKey).publicExtendedKey,
          hdPath: KEYCARD_ACCOUNT_HD_PATH,
          keyUid: tappedKeyUid
        }
      },
      assertCardHasWallet
    )
  }

  /** Signs an already computed 32-byte hash with the key at `path`. */
  signHash = async ({
    hashHex,
    path,
    expectedKeyUid
  }: {
    hashHex: string
    path: string
    expectedKeyUid: string
  }): Promise<NfcSignature> => {
    const hash = hexStringToUint8Array(hashHex)

    return this.#runOnCard(
      'sign',
      async (cmdSet) => {
        const keyUid = cmdSet.applicationInfo?.keyUID
        const tappedKeyUid = keyUid?.length ? Buffer.from(keyUid).toString('hex') : ''
        assertCardHoldsKey(tappedKeyUid, expectedKeyUid)

        const response = (await cmdSet.signWithPath(hash, path, false)).checkOK().data
        const signature = new RecoverableSignature({ hash, tlvData: response })

        return {
          r: toSignatureComponentHex(signature.r!),
          s: toSignatureComponentHex(signature.s!),
          v: signature.recId! + 27
        }
      },
      (tappedKeyUid) => assertCardHoldsKey(tappedKeyUid, expectedKeyUid)
    )
  }
}

export default new KeycardNfcService()
