import type { JsonRpcProvider } from 'ethers'
import {
  encodeAbiParameters,
  hashMessage,
  hashTypedData,
  isAddress,
  type TypedDataDefinition
} from 'viem'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  ExternalKey,
  ExternalSignerController,
  KeystoreSignerInterface,
  SignMessageContext
} from '@ambire-common/interfaces/keystore'
import { RPC_HARDCODED_ERRORS } from '@ambire-common/libs/errorDecoder/handlers/rpc'

import PQ1Controller from '../../controllers/PQ1Controller'
import { resolvePq1AccountState, type Pq1AccountState } from '../pq1/aa/accountState'
import { pq1BroadcastAccountOp } from '../pq1/aa/broadcast'
import { BundlerError } from '../pq1/aa/bundler'
import { isAccountIndex, PQ1_SUPPORTED_CHAIN_IDS } from '../pq1/config'
import { buildErc7730Eip712Pieces } from '../pq1/erc7730/eip712'
import { buildErc7730BundleForEip712 } from '../pq1/erc7730/lookup'
import {
  isPq1Error,
  PQ1_SEND_FAILED_MESSAGE,
  PQ1_UNSUPPORTED_NETWORK_MESSAGE,
  toUserFacingPq1Error
} from '../pq1/errors'
import { bytesToHex0x, hexToBytes } from '../pq1/transport/bytes'
import {
  buildStructuredOffchainRequest,
  structuredCapability
} from '../pq1/offchain/structuredSign'
import { classifyStructuredTypedData } from '../pq1/offchain/structuredTypedData'
import { DeviceError } from '../pq1/transport/hid'
import type { SignOffchainBundle, SignOffchainRequest } from '../pq1/transport/offchain'
import { personalSignFitsDevice } from '../pq1/transport/personalSignView'

/** A Safe / CoW typed-data request whose domain names a different chain
 *  than the one the request was made on. */
const STRUCTURED_WRONG_NETWORK_MESSAGE =
  "This signature request is for a different network than the one you're on. Switch to that network in the app and try again. Nothing was signed."

/** A Safe / CoW typed-data request from an account not yet deployed on
 *  this network: neither a Safe nor CoW Swap can check its signature. */
const STRUCTURED_UNDEPLOYED_MESSAGE =
  "Your PQ1 account isn't set up on this network yet, so a Safe or CoW Swap can't check this signature. Send one transaction from the account on this network first, then try again. Nothing was signed."

type TypedMessage = Parameters<KeystoreSignerInterface['signTypedData']>[0]

/** Ambire hands over ethers-style typed data; for valid EIP-712 input it is
 *  structurally what viem expects. */
const asViemTypedData = (typedData: TypedMessage) => typedData as unknown as TypedDataDefinition

const isHexAddress = (v: unknown): v is `0x${string}` =>
  typeof v === 'string' && isAddress(v, { strict: false })

/** True for a failure Ambire's own broadcast error handling words for the
 *  user: a bundler rejection, or a failed read from the RPC provider (an
 *  ethers error, whose `code` is a string such as 'NETWORK_ERROR', or
 *  Ambire's own RPC timeout). */
const isBundlerOrRpcError = (e: unknown): boolean =>
  e instanceof Error &&
  !isPq1Error(e) &&
  (e instanceof BundlerError ||
    typeof (e as { code?: unknown }).code === 'string' ||
    e.message.startsWith(RPC_HARDCODED_ERRORS.rpcTimeout))

/**
 * Signing surface for a PQ1 hardware wallet account.
 *
 * PQ1 is a smart-account-only signer (no EOA), so the EOA-style methods
 * (`signRawTransaction`, `sign7702`, `signTransactionTypeFour`) throw. The
 * caller is expected to route transaction signing through
 * `broadcastAccountOp` instead — see the `signingKeyType === 'pq1'` branch
 * in ambire-common's `SignAccountOpController`.
 *
 * Message signing (`signMessage`, `signTypedData`) produces an ERC-1271
 * wrapped signature: `abi.encode(uint256 ownerIndex, bytes innerSig)`.
 * Verifiers must call `PQSmartWallet.isValidSignature(hash, sig)` to verify
 * — a SPHINCS+ signature is not ECDSA-recoverable.
 */
class PQ1Signer implements KeystoreSignerInterface {
  key: ExternalKey & { isExternallyStored: boolean }

  controller: PQ1Controller | null = null

  constructor(_key: ExternalKey) {
    this.key = { ..._key, isExternallyStored: true }
  }

  init(externalDeviceController?: ExternalSignerController) {
    if (!externalDeviceController) {
      throw new ExternalSignerError(
        'The PQ1 signer could not start. Please reload the extension and try again.',
        { sendCrashReport: true }
      )
    }
    this.controller = externalDeviceController as PQ1Controller
  }

  /**
   * Pair-and-unlock the device for an in-flight signing/broadcast op.
   *
   * Why we re-acquire here: the popup-side import flow opens the WebHID
   * handle, discovers addresses, then `cleanUp()`s the transport so the
   * background can take over. By the time `broadcastAccountOp` /
   * `signMessage` runs in the service worker, the *background's*
   * `PQ1Controller` has a fresh `walletSDK === null`, even though the
   * browser still remembers the device permission and the device itself is
   * plugged in and unlocked.
   *
   * `controller.unlock()` is idempotent: if the SDK is already live it
   * just refreshes status; otherwise it calls `HidTransport.connect()`,
   * which tries `navigator.hid.getDevices()` first (no user gesture
   * required, works in MV3 service workers) and only falls back to
   * `requestDevice()` when there's no previously-granted device. Since
   * the popup already granted permission, `getDevices()` returns the
   * PQ1 and `open()` succeeds without UI.
   *
   * If the device firmware is locked, this will trigger the on-device
   * PIN prompt — which is the correct UX.
   *
   * unlock() is also called when `walletSDK` already exists: it probes the
   * handle with the ungated GET_STATUS (one ~ms APDU round trip), so a
   * stale handle (unplug/replug, OS drop) reconnects and a firmware that
   * idle-locked itself (2-minute timeout) re-prompts for the PIN *before*
   * we build and send an expensive sign payload.
   */
  async #acquireDevice() {
    if (!this.controller) {
      throw new ExternalSignerError(
        'The PQ1 signer could not start. Please reload the extension and try again.',
        { sendCrashReport: true }
      )
    }
    await this.controller.unlock()
    if (!this.controller.walletSDK) {
      throw new ExternalSignerError(
        "The PQ1 isn't connected. Plug it in, unlock it with your PIN, and try again.",
        { sendCrashReport: false }
      )
    }
    // Another PQ1 would sign with its own keys for the same account number,
    // producing a signature that fails verification.
    if (this.controller.deviceId !== this.key.meta.deviceId) {
      throw new ExternalSignerError(
        'This account belongs to a different PQ1. Plug in the PQ1 you added it from, then try again.',
        { sendCrashReport: false }
      )
    }
    return this.controller.walletSDK
  }

  /** Run a device operation with one automatic recovery pass: if the
   *  firmware idle-locks (2-minute timeout) between the pre-flight check
   *  and the command, the op fails with a typed 'locked' DeviceError
   *  *before* anything was signed — so we re-run the unlock flow (which
   *  triggers the on-device PIN prompt) and replay the operation once.
   *  Deliberate on-device rejections carry code 'rejected' and are never
   *  retried. */
  async #withDevice<T>(
    run: (sdk: NonNullable<PQ1Controller['walletSDK']>) => Promise<T>
  ): Promise<T> {
    const sdk = await this.#acquireDevice()
    try {
      return await run(sdk)
    } catch (e) {
      if (!(e instanceof DeviceError) || e.code !== 'locked') throw e
      const fresh = await this.#acquireDevice()
      return run(fresh)
    }
  }

  /** The device account (0-255) this key belongs to, stored as its `index`. */
  #accountIndex(): number {
    const { index } = this.key.meta
    if (!isAccountIndex(index)) {
      console.error(`[pq1] key meta has an invalid account index: ${String(index)}`)
      throw new ExternalSignerError(
        "This PQ1 account's saved details are damaged. Remove the account and import it again.",
        { sendCrashReport: true }
      )
    }
    return index
  }

  /** PQ1 contracts (factory, verifier, EntryPoint wiring) exist only on a
   *  fixed set of chains. Anywhere else a signature would reference a
   *  factory that doesn't exist (ERC-6492) or a wallet that can never be
   *  deployed — refuse with a clear message instead of emitting blobs no
   *  verifier can validate. */
  #requireSupportedChain(chainId: bigint | number, op: string) {
    if (!PQ1_SUPPORTED_CHAIN_IDS.includes(Number(chainId))) {
      console.warn(`[pq1] ${op}: chain ${chainId.toString()} is not a PQ1 chain`)
      throw new ExternalSignerError(PQ1_UNSUPPORTED_NETWORK_MESSAGE)
    }
  }

  /** Fresh on-chain deploy status + active slot/ownerIndex. Never trust
   *  the values cached in key meta at import time — they go stale after
   *  an owner-slot rotation, and a stale ownerIndex makes every ERC-1271
   *  verification fail (see `resolvePq1AccountState`). */
  async #resolveAccountState(provider: JsonRpcProvider, op: string): Promise<Pq1AccountState> {
    try {
      return await resolvePq1AccountState(provider, this.key.addr as `0x${string}`)
    } catch (e) {
      console.warn(`[pq1] ${op}: reading the wallet's on-chain state failed`, e)
      throw new ExternalSignerError(
        "Couldn't check your PQ1 account on this network. Check your internet connection and try again.",
        { sendCrashReport: false }
      )
    }
  }

  /** Pack the device's raw SPHINCS+C10 signature into the wrapper the
   *  PQSmartWallet's `_validateSignature` expects:
   *  `abi.encode(uint256 ownerIndex, bytes innerSig)`. */
  #wrap(innerSig: Uint8Array, ownerIndex: bigint): `0x${string}` {
    return encodeAbiParameters(
      [
        { name: 'ownerIndex', type: 'uint256' },
        { name: 'signature', type: 'bytes' }
      ],
      [ownerIndex, bytesToHex0x(innerSig)]
    )
  }

  /** Map a device sign bundle to the signature the verifier consumes: the
   *  firmware's ready-made ERC-6492 blob for counterfactual wallets, or
   *  the ERC-1271 ownerIndex wrapper for deployed ones. */
  #toSignature(bundle: SignOffchainBundle, ownerIndex: bigint): `0x${string}` {
    if (bundle.kind === 'counterfactual') {
      // Firmware already produced the EIP-6492-wrapped blob (factory +
      // factoryCalldata + sigWrapper + 0x6492…6492 magic). Pass it
      // straight through to the dapp.
      return bytesToHex0x(bundle.erc6492Sig)
    }
    return this.#wrap(bundle.innerSig, ownerIndex)
  }

  /** PQ1's output is verified on-chain, so we must know which chain the
   *  verifier will run on — otherwise we cannot decide between the bare
   *  ERC-1271 wrapper and the ERC-6492 deploy-and-verify blob. Every
   *  call site in `libs/signMessage/signMessage.ts` threads a
   *  {@link SignMessageContext} through; if a new path forgets it we
   *  fail loudly here rather than silently signing for the wrong chain. */
  #requireCtx(ctx: SignMessageContext | undefined, op: string): SignMessageContext {
    if (ctx) return ctx
    console.error(
      `[pq1] ${op}: SignMessageContext { chainId, provider } is required so the device knows which chain the signature is bound to. The keystore caller must pass it through. See KeystoreSignerInterface.${op}.`
    )
    throw new ExternalSignerError(
      "Couldn't prepare this signature for your PQ1. Please try again.",
      { sendCrashReport: true }
    )
  }

  signMessage: KeystoreSignerInterface['signMessage'] = async (hex, ctx) => {
    const { chainId, provider } = this.#requireCtx(ctx, 'signMessage')
    this.#requireSupportedChain(chainId, 'signMessage')
    const accountIndex = this.#accountIndex()

    // Live on-chain state → set the firmware's account_deployed flag and
    // the active slot. On the counterfactual path the device emits an
    // ERC-6492-wrapped blob and the firmware requires slot_index=0 (the
    // only owner the factory seeds); on the deployed path we use the
    // freshly-derived slot.
    const { isDeployed, slotIndex, ownerIndex } = await this.#resolveAccountState(
      provider,
      'signMessage'
    )

    try {
      const messageBytes = hexToBytes(hex)
      const common = { accountIndex, slotIndex, chainId, accountDeployed: isDeployed } as const
      const bundle = await this.#withDevice((sdk) =>
        personalSignFitsDevice(messageBytes)
          ? // Pass the raw message — firmware computes the EIP-191 prefix hash
            // and shows the message on its screen before signing: as text
            // (line breaks kept), or as hex when it isn't text.
            sdk.commands.signOffchain({
              ...common,
              kind: 'personal_sign',
              message: messageBytes
            })
          : // The message doesn't fit the device's pages (over 700 bytes,
            // over 512 bytes of non-text shown as hex, or too many lines).
            // Fall back to raw32 mode using the EIP-191 digest computed on
            // this side. The device will only show the digest, not the
            // message.
            sdk.commands.signOffchain({
              ...common,
              kind: 'raw32',
              digest: hexToBytes(hashMessage({ raw: messageBytes }))
            })
      )

      return this.#toSignature(bundle, ownerIndex)
    } catch (e) {
      throw toUserFacingPq1Error(e)
    }
  }

  signTypedData: KeystoreSignerInterface['signTypedData'] = async (typedData, ctx) => {
    const { chainId, provider } = this.#requireCtx(ctx, 'signTypedData')
    this.#requireSupportedChain(chainId, 'signTypedData')
    const accountIndex = this.#accountIndex()

    const { isDeployed, slotIndex, ownerIndex } = await this.#resolveAccountState(
      provider,
      'signTypedData'
    )
    const common = { accountIndex, slotIndex, chainId, accountDeployed: isDeployed } as const

    // The first route that fits: the device's own Safe transaction / CoW
    // order screens, an ERC-7730 descriptor, or the EIP-712 hash signed
    // blind. A request sent on one route is never retried on a weaker one.
    try {
      const request =
        (await this.#structuredRequest(typedData, chainId, isDeployed)) ??
        (await this.#descriptorRequest(typedData, chainId)) ??
        this.#blindHashRequest(typedData)
      const bundle = await this.#withDevice((sdk) =>
        sdk.commands.signOffchain({ ...request, ...common })
      )
      return this.#toSignature(bundle, ownerIndex)
    } catch (e) {
      throw toUserFacingPq1Error(e)
    }
  }

  /** A Safe transaction or CoW order the device can show natively (off-chain
   *  kinds 4 / 5), or null. The device re-derives the EIP-712 hash and signs
   *  what a blind sign of it would. The route is chosen by the device's
   *  capability bit only, so a refusal on this route is final. */
  async #structuredRequest(
    typedData: TypedMessage,
    chainId: bigint,
    isDeployed: boolean
  ): Promise<SignOffchainRequest | null> {
    const structured = classifyStructuredTypedData(typedData)
    if (structured.kind === 'other') return null
    if (structured.chainId !== chainId) {
      throw new ExternalSignerError(STRUCTURED_WRONG_NETWORK_MESSAGE, { sendCrashReport: false })
    }
    const capabilities = await this.#withDevice((sdk) => sdk.commands.getCapabilities())
    if (!(capabilities & structuredCapability(structured))) {
      console.warn(
        `[pq1] signTypedData: this PQ1's firmware can't show a ${structured.kind} — signing its hash blind`
      )
      return null
    }
    if (!isDeployed) {
      throw new ExternalSignerError(STRUCTURED_UNDEPLOYED_MESSAGE, { sendCrashReport: false })
    }
    return buildStructuredOffchainRequest(structured)
  }

  /** Typed data an ERC-7730 descriptor covers (off-chain kind 2), or null:
   *  the device then shows its fields the way the descriptor names them.
   *  Needs a descriptor for `(chainId, verifyingContract)` and a message of
   *  static fields only (see `buildErc7730Eip712Pieces`). */
  async #descriptorRequest(
    typedData: TypedMessage,
    chainId: bigint
  ): Promise<SignOffchainRequest | null> {
    const domain = asViemTypedData(typedData).domain ?? {}
    const { verifyingContract } = domain
    if (!isHexAddress(verifyingContract)) return null
    const pieces = buildErc7730Eip712Pieces({
      domain: { ...domain, verifyingContract },
      types: typedData.types,
      primaryType: typedData.primaryType,
      message: typedData.message
    })
    if (!pieces) return null
    const erc7730Bundle = await buildErc7730BundleForEip712({
      chainId,
      verifyingContract,
      primaryTypeHash: pieces.primaryTypeHash
    })
    if (!erc7730Bundle) return null
    return { kind: 'eip712_typed', ...pieces, erc7730Bundle }
  }

  /** The EIP-712 hash, signed blind (off-chain kind 0): the device shows a
   *  loud BLIND HASH page and the hash. Used, intentionally, for typed data
   *  the device has no other route for. */
  #blindHashRequest(typedData: TypedMessage): SignOffchainRequest {
    const digest = hashTypedData(asViemTypedData(typedData))
    return { kind: 'raw32', digest: hexToBytes(digest) }
  }

  // PQ1 is a smart-account-only signer — these EOA paths are never valid.
  // Ambire offers a PQ1 account as the fee payer of another account's
  // transaction like any account it sees as an EOA, which lands here.
  signRawTransaction: KeystoreSignerInterface['signRawTransaction'] = async () => {
    throw new ExternalSignerError(
      "A PQ1 account can only send its own transactions, so it can't pay the fee for another account. Choose another way to pay the fee and try again.",
      { sendCrashReport: false }
    )
  }

  /**
   * Smart-account broadcast entrypoint. signAccountOp calls this for PQ1
   * accounts instead of `signRawTransaction` + raw-eth_sendRawTransaction.
   * Packages the calls into a single ERC-4337 UserOperation, signs on-device,
   * and submits via Pimlico. Returns the userOpHash + EntryPoint nonce —
   * inclusion and per-op success are tracked by Ambire's ActivityController
   * via `identifiedBy: { type: 'UserOperation' }`.
   */
  broadcastAccountOp: NonNullable<KeystoreSignerInterface['broadcastAccountOp']> = async ({
    chainId,
    provider,
    calls,
    gasFeePayment
  }) => {
    this.#requireSupportedChain(chainId, 'broadcastAccountOp')
    // The same build-time key ambire-common's Pimlico bundler reads.
    const apiKey = process.env.REACT_APP_PIMLICO_API_KEY || ''
    if (!apiKey) {
      console.error('[pq1] REACT_APP_PIMLICO_API_KEY is missing from this build')
      throw new ExternalSignerError(
        "Sending from a PQ1 account isn't available in this version of Ambire.",
        { sendCrashReport: true }
      )
    }
    // The PQSmartWallet executes via `executeWithOffchainCount(to, ...)` —
    // there is no CREATE path, so a contract-deployment call (no `to`)
    // must be refused up front instead of failing deep in the ABI encoder.
    const deployCall = calls.find((c) => !c.to)
    if (deployCall) {
      throw new ExternalSignerError(
        "A PQ1 account can't create new contracts directly. Nothing was sent."
      )
    }
    try {
      // #withDevice may replay the whole pipeline once on a mid-flight
      // idle-lock. That's safe: a 'locked' error can only originate from
      // the device APDUs, which all happen before the UserOp is submitted
      // to the bundler — the retry just re-estimates and re-signs.
      const result = await this.#withDevice((sdk) =>
        pq1BroadcastAccountOp({
          accountIndex: this.#accountIndex(),
          sender: this.key.addr as `0x${string}`,
          chainId: Number(chainId),
          calls: calls.map((c) => ({
            to: c.to as `0x${string}`,
            value: c.value,
            data: c.data as `0x${string}`
          })),
          pimlicoApiKey: apiKey,
          provider,
          device: sdk.commands,
          // Bind the UserOp's fee fields to what the user approved in the
          // fee UI — the charge must match the confirmation screen.
          fee: {
            maxFeePerGas: gasFeePayment.gasPrice,
            maxPriorityFeePerGas: gasFeePayment.maxPriorityFeePerGas ?? gasFeePayment.gasPrice
          }
        })
      )
      return { userOpHash: result.userOpHash, nonce: result.nonce }
    } catch (e) {
      // A bundler rejection or an RPC failure goes on unchanged to
      // SignAccountOpController, which words it (and offers a fee refresh)
      // like any other broadcast failure. Everything else is worded here:
      // device states and refusals plainly, anything unexpected as a failed
      // send (and reported to Sentry).
      if (isBundlerOrRpcError(e)) throw e
      throw toUserFacingPq1Error(e, PQ1_SEND_FAILED_MESSAGE)
    }
  }

  sign7702: KeystoreSignerInterface['sign7702'] = async () => {
    throw new ExternalSignerError("A PQ1 account can't sign this type of authorization.", {
      sendCrashReport: true
    })
  }

  signTransactionTypeFour: KeystoreSignerInterface['signTransactionTypeFour'] = async () => {
    throw new ExternalSignerError("A PQ1 account can't sign this type of transaction.", {
      sendCrashReport: true
    })
  }
}

export default PQ1Signer
