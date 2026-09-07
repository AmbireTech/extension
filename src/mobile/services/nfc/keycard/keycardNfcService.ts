import { Buffer } from 'buffer'
import { CardIOError } from 'keycard-sdk/dist/apdu-exception'
import { APDUResponse } from 'keycard-sdk/dist/apdu-response'
import { BIP32KeyPair } from 'keycard-sdk/dist/bip32key'
import {
  CardCmdExecutionError,
  CardLoadKeyError,
  CardPairingError,
  CardPinVerificationError,
  KeycardManager,
  KManagerError,
  LOADED
} from 'keycard-sdk/dist/keycard-manager'
import { RecoverableSignature } from 'keycard-sdk/dist/recoverable-signature'
import { Platform } from 'react-native'
import NfcManager, { NfcError, NfcEvents, NfcTech } from 'react-native-nfc-manager'

import { NfcWalletType } from '@ambire-common/interfaces/keystore'
import { addHexPrefix } from '@ambire-common/utils/addHexPrefix'
import hexStringToUint8Array from '@ambire-common/utils/hexStringToUint8Array'
import { NFC_CANCELLED_MESSAGE } from '@common/modules/hardware-wallets/nfc/consts'
import {
  NfcCardService,
  NfcExportedKey,
  NfcSessionPurpose,
  NfcSessionState,
  NfcSignature,
  NfcSignHashParams
} from '@common/modules/hardware-wallets/nfc/types'
import keycardPairingStorage from '@mobile/services/nfc/keycard/keycardPairingStorage'

import type { APDUCommand } from 'keycard-sdk/dist/apdu-command'
import type { CardChannel } from 'keycard-sdk/dist/card-channel'
import type { Commandset } from 'keycard-sdk/dist/commandset'
// All Keycard communication happens HERE, in the React Native context, because
// the NFC radio is a native module the WebView worker (where the controllers run)
// cannot reach. The worker-side NfcController forwards signing to this singleton
// over the message bridge (see WebViewWorker.tsx `nfc.*` cases), while the
// account import flow calls it directly through the import hook.
//
// The PIN never leaves this file: the UI hands it in through `submitPin` and it is
// held in memory for one account op's signing at most (see `#sessionPin`). It is never
// persisted, never sent over the bridge and never written to a controller.

/**
 * The path the extended public key is exported from. It sits one level above the
 * BIP44 standard chain, so the same key covers both the standard chain (0/<index>)
 * and the Ledger Legacy path (<index>) without tapping the card again.
 */
export const KEYCARD_ACCOUNT_HD_PATH = "m/44'/60'/0'"

/**
 * Android's default IsoDep timeout (~600ms) is too short for the card's key
 * derivation and signing, which makes long taps fail with a transceive error.
 */
const ANDROID_ISO_DEP_TIMEOUT = 5000

/**
 * How long iOS is given to report a card session as closed before signing carries on
 * without the report. See `#closeCardSession`.
 */
const IOS_SESSION_CLOSE_TIMEOUT = 5000

class KeycardCancelledError extends Error {
  constructor() {
    super(NFC_CANCELLED_MESSAGE)
  }
}

/** Bridges keycard-sdk's APDU commands onto the NFC transport. */
class NfcCardChannel implements CardChannel {
  connected = false

  /**
   * Set when the radio link, rather than the card, is what failed. The SDK reports
   * every mid-handshake failure as a pairing problem, so this is the only reliable
   * way to tell "the card slipped" from "the pairing is bad".
   */
  transportError: any = null

  async send(cmd: APDUCommand): Promise<APDUResponse> {
    try {
      const response = await NfcManager.isoDepHandler.transceive(Array.from(cmd.serialize()))

      return new APDUResponse(new Uint8Array(response))
    } catch (e: any) {
      this.transportError = e
      // Must be a CardIOError: the SDK deletes the stored pairing (and burns one of
      // the card's pairing slots re-pairing) for any other error type.
      throw new CardIOError(e)
    }
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

class KeycardOperationError extends Error {}

const assertCardHasWallet = (keyUid: string) => {
  if (!keyUid) throw new KeycardOperationError(NO_WALLET_ON_CARD_MESSAGE)
}

const assertCardHoldsKey = (keyUid: string, expectedKeyUid: string) => {
  assertCardHasWallet(keyUid)

  if (expectedKeyUid && keyUid !== expectedKeyUid) {
    throw new KeycardOperationError(
      'This card holds a different wallet than the account you are signing with. Please tap the right card.'
    )
  }
}

const isUserCancelledNfcError = (e: any) =>
  e instanceof NfcError.UserCancel || e instanceof KeycardCancelledError

/**
 * The RF link broke mid-exchange - the card shifted, was lifted too early, or the
 * antenna lost it for a moment (Core NFC errors 100 / 102). The card itself is fine,
 * so the operation is worth retrying once the card is back.
 */
const isTagLostError = (e: any) =>
  e instanceof NfcError.TagConnectionLost ||
  e instanceof NfcError.TagResponseError ||
  e instanceof NfcError.SessionInvalidated ||
  e instanceof CardIOError

/** How many times a lost card is waited for again before giving up. */
const TAG_LOST_RETRIES = 2

class KeycardNfcService implements NfcCardService {
  nfcWalletType: NfcWalletType = 'keycard'

  #state: NfcSessionState = {
    step: 'idle',
    purpose: null,
    error: null,
    pinAttemptsLeft: null
  }

  #listeners = new Set<(state: NfcSessionState) => void>()

  /** Resolves the PIN the UI is currently being asked for. */
  #pendingPrompt: { resolve: (value: string) => void; reject: (error: Error) => void } | null = null

  /**
   * The PIN of the account op being signed right now, kept only for as long as
   * SignAccountOpController says its signing lasts. Null while no session is open,
   * which is what makes every other tap (a message, the next op) ask for it again.
   */
  #sessionPin: string | null = null

  #isPinSessionOpen = false

  #keycardManager = new KeycardManager(keycardPairingStorage)

  #isNfcManagerStarted = false

  #isCancelled = false

  /** The last error thrown by a card command, kept because the SDK loses it. */
  #callbackError: any = null

  /**
   * Set when the last tap failed on the radio link rather than on the card. The SDK
   * rewraps such failures as pairing or secure channel errors, so without it a card
   * that merely slipped is reported as a broken pairing.
   */
  #transportError: any = null

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

  /** Called by the UI when the user submits the PIN. */
  submitPrompt = (value: string) => {
    const prompt = this.#pendingPrompt
    if (!prompt) return

    this.#pendingPrompt = null
    prompt.resolve(value)
  }

  // Opens / closes the window in which one PIN entry covers every tap. `cancel` must
  // never close it: it also runs as routine cleanup right before every signature.
  beginPinSession = () => {
    this.#isPinSessionOpen = true
    this.#sessionPin = null
  }

  endPinSession = () => {
    this.#isPinSessionOpen = false
    this.#sessionPin = null
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

  #promptUser(step: 'awaiting-pin', error: string | null = null): Promise<string> {
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
    let didOpenSession = false

    try {
      this.#setState({ step: 'awaiting-tap', error: null })
      await NfcManager.requestTechnology(NfcTech.IsoDep, { alertMessage })
      didOpenSession = true

      if (Platform.OS === 'android') await NfcManager.setTimeout(ANDROID_ISO_DEP_TIMEOUT)

      channel.connected = true
      this.#setState({ step: 'communicating' })

      return await this.#runWithTagRetry(channel, cb)
    } finally {
      this.#transportError = channel.transportError
      channel.connected = false
      await this.#closeCardSession(didOpenSession)
    }
  }

  /**
   * iOS reports a session closed only once its scan sheet has dismissed, seconds after
   * `cancelTechnologyRequest` resolved, and delivers that report to whichever card
   * request is pending by then - so a session opened in between is killed by the
   * previous one's cancellation. Waiting for the report stops consecutive signatures
   * of one account op from cancelling each other. Android closes synchronously.
   */
  async #closeCardSession(didOpenSession: boolean) {
    if (Platform.OS !== 'ios' || !didOpenSession) {
      await NfcManager.cancelTechnologyRequest().catch(() => {
        // The session may already be closed (card moved away, user cancelled).
      })
      return
    }

    const sessionClosed = new Promise<void>((resolve) => {
      const finish = () => {
        clearTimeout(timeoutId)
        NfcManager.setEventListener(NfcEvents.SessionClosed, null)
        resolve()
      }
      // A session that never reports back must not block signing forever.
      const timeoutId = setTimeout(finish, IOS_SESSION_CLOSE_TIMEOUT)

      NfcManager.setEventListener(NfcEvents.SessionClosed, finish)
    })

    await NfcManager.cancelTechnologyRequest().catch(() => {
      // The session may already be closed (card moved away, user cancelled).
    })

    await sessionClosed
  }

  /**
   * Runs a card command, waiting for the card again if the RF link drops mid-exchange
   * instead of failing the whole operation. On iOS the session (and its system sheet)
   * is kept open and polling is restarted, which is what Keycard's own iOS SDK does
   * for the same errors. Everything is re-sent from the start, so the retry re-opens
   * the secure channel - card commands are not resumable.
   */
  async #runWithTagRetry<T>(
    channel: NfcCardChannel,
    cb: (channel: NfcCardChannel) => Promise<T>
  ): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      channel.transportError = null

      try {
        return await cb(channel)
      } catch (e: any) {
        // The SDK rewraps transport failures as pairing/secure-channel errors, so the
        // channel's own flag is what decides whether the card merely slipped.
        const isTagLost = isTagLostError(e) || !!channel.transportError

        if (!isTagLost || attempt >= TAG_LOST_RETRIES || this.#isCancelled) throw e

        this.#setState({ step: 'awaiting-tap' })

        await this.#waitForCardAgain()
        this.#setState({ step: 'communicating' })
      }
    }
  }

  async #waitForCardAgain() {
    if (Platform.OS === 'ios') {
      await NfcManager.setAlertMessageIOS('Hold your card still against the phone.')
      // Keeps the same session and sheet; resolves once a card is presented again.
      await NfcManager.restartTechnologyRequestIOS()
      return
    }

    // Android has no session to keep alive - re-request the tag instead.
    await NfcManager.cancelTechnologyRequest().catch(() => {
      // Already closed; the re-request below is what matters.
    })
    await NfcManager.requestTechnology(NfcTech.IsoDep)
    await NfcManager.setTimeout(ANDROID_ISO_DEP_TIMEOUT)
  }

  /**
   * Runs one card command: gets the PIN and the card, opens the secure channel and
   * executes `cb`. A wrong PIN re-prompts instead of failing, so the user does not
   * have to restart the whole flow.
   *
   * The PIN is collected before the tap, never during it. iOS leaves no other option
   * (an open NFC session puts a system sheet over the app, so nothing of ours can be
   * typed into until the session ends) and Android follows the same order, so the flow
   * the user goes through is identical on both platforms.
   */
  async #runOnCard<T>(
    purpose: NfcSessionPurpose,
    cb: (cmdSet: Commandset) => Promise<T>
  ): Promise<T> {
    // Only signing taps inside an account op's session share a PIN. An import is a
    // one-off tap and never part of one, so it always asks.
    const isPinReusable = purpose === 'sign' && this.#isPinSessionOpen

    let pin = ''
    let pinError: string | null = null

    this.#isCancelled = false
    this.#setState({ purpose, error: null, pinAttemptsLeft: null })

    try {
      while (true) {
        pin =
          (isPinReusable && this.#sessionPin) || (await this.#promptUser('awaiting-pin', pinError))
        // Per attempt, so a wrong PIN retry is not reported through the failure of the
        // attempt before it.
        this.#callbackError = null
        this.#transportError = null

        try {
          const result = await this.#withCardSession(async (channel) => {
            const response = await this.#keycardManager.runOnSecureChannel(
              channel,
              LOADED,
              {
                pin,
                // The SDK falls back to Keycard's default pairing password, which is
                // what every Keycard app and SDK uses - a custom one is not something
                // users are ever asked to set, so it is never prompted for here.
                // Empty lists tell the SDK to skip the card authenticity check, which
                // needs Keycard's certificate authority keys. Cards running applet 4.0+
                // are verified by the SDK through their on-card certificate instead.
                caPublicKeys: [],
                skipVerificationUID: []
              },
              // The SDK collapses anything the callback throws into
              // "Error executing callback function. ${err}", losing the message on
              // errors that stringify poorly. Keep the original so the failure can
              // still be reported (and logged) accurately.
              async (cmdSet) => {
                try {
                  return await cb(cmdSet)
                } catch (callbackError: any) {
                  this.#callbackError = callbackError
                  throw callbackError
                }
              }
            )

            if (response.status !== 'success') {
              throw new KManagerError(
                response.data?.message || 'Card command failed.',
                response.data?.type,
                response.data
              )
            }

            return response.data.cbFuncResponse as T
          })

          if (isPinReusable) this.#sessionPin = pin
          this.#setState({ step: 'idle', purpose: null, error: null, pinAttemptsLeft: null })

          return result
        } catch (e: any) {
          if (this.#isCancelled || isUserCancelledNfcError(e)) throw new KeycardCancelledError()

          // A kept PIN the card rejected must never be retried - it would burn the
          // card's remaining attempts without ever prompting.
          if (e?.errorCode === CardPinVerificationError) this.#sessionPin = null

          const attemptsLeft = this.#getPinAttemptsLeft(e)
          if (attemptsLeft !== null && attemptsLeft > 0) {
            pinError = `Wrong PIN. ${attemptsLeft} ${
              attemptsLeft === 1 ? 'attempt' : 'attempts'
            } left before the card locks.`
            this.#setState({ pinAttemptsLeft: attemptsLeft })

            continue
          }

          throw new Error(this.#getUserFacingError(e))
        }
      }
    } catch (e: any) {
      const message = isUserCancelledNfcError(e) ? NFC_CANCELLED_MESSAGE : e?.message
      this.#setState({ step: 'idle', purpose: null, error: null, pinAttemptsLeft: null })

      throw new Error(message || 'Could not talk to your card. Please try again.')
    } finally {
      pin = ''
    }
  }

  #getPinAttemptsLeft(e: any): number | null {
    if (e?.errorCode !== CardPinVerificationError) return null

    const attemptsLeft = e?.cardData?.pinRetry

    return typeof attemptsLeft === 'number' ? attemptsLeft : null
  }

  #getUserFacingError(e: any): string {
    // Checked first, and on the callback error too: a card that shifts mid-command
    // fails the command, so the SDK reports it as one - the dropped radio link is
    // only visible on the error the command itself threw.
    if (
      this.#transportError ||
      isTagLostError(e) ||
      isTagLostError(this.#callbackError) ||
      e instanceof NfcError.Timeout
    ) {
      return 'Lost connection to the card. Hold it flat against the phone, without moving it, until the operation finishes.'
    }

    // The card was reached and unlocked; the command itself is what failed. Only our
    // own messages are worth showing - the SDK's are technical.
    if (
      e?.errorCode === CardCmdExecutionError &&
      this.#callbackError instanceof KeycardOperationError
    ) {
      return this.#callbackError.message
    }

    if (e?.errorCode === CardPinVerificationError) {
      return 'The card is locked because the PIN was entered wrongly too many times. Unblock it with your PUK code in the Keycard app.'
    }

    if (e?.errorCode === CardLoadKeyError) {
      return 'There is no wallet on this card yet. Set the card up in the Keycard app first, then import it here.'
    }

    if (e?.errorCode === CardPairingError) {
      return 'Could not connect to this card. It may have run out of free slots for apps - remove the ones you no longer use in the Keycard app, then try again.'
    }

    // Anything left is not something the user can be told how to fix, and the SDK's
    // wording would only confuse - it is logged instead, so it can be recognized later.
    console.error('Unknown Keycard error:', e, 'card command error:', this.#callbackError)

    return 'Could not talk to your card. Please try again.'
  }

  /**
   * Exports the account-level extended public key, so every address can be derived
   * without the card. Tapped once, during import.
   */
  exportAccountKey = async (): Promise<NfcExportedKey> => {
    return this.#runOnCard('import', async (cmdSet) => {
      const keyUid = cmdSet.applicationInfo?.keyUID
      const tappedKeyUid = keyUid?.length ? Buffer.from(keyUid).toString('hex') : ''
      assertCardHasWallet(tappedKeyUid)

      const exportedKey = (
        await cmdSet.exportExtendedKey(0, KEYCARD_ACCOUNT_HD_PATH, false)
      ).checkOK().data

      return {
        extendedPublicKey: BIP32KeyPair.extendedKey(exportedKey).publicExtendedKey,
        hdPath: KEYCARD_ACCOUNT_HD_PATH,
        keyUid: tappedKeyUid,
        nfcWalletType: this.nfcWalletType
      }
    })
  }

  /** Signs an already computed 32-byte hash with the key at `path`. */
  signHash = async ({
    hashHex,
    path,
    expectedKeyUid
  }: NfcSignHashParams): Promise<NfcSignature> => {
    const hash = hexStringToUint8Array(hashHex)

    return this.#runOnCard('sign', async (cmdSet) => {
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
    })
  }
}

export default new KeycardNfcService()
