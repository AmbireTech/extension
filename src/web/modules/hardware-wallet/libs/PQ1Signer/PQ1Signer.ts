import {
  isPq1Error,
  MAX_ACCOUNT_INDEX,
  PQ1_ERROR_MESSAGES,
  PQ1_SUPPORTED_CHAIN_IDS,
  type Pq1Device
} from 'pq1-sdk'
import {
  BundlerError,
  prepareTransaction,
  signPq1Message,
  signPq1TypedData,
  signPreparedTransaction,
  submitUserOperation,
  type Pq1TypedData,
  type SignOffchainContext
} from 'pq1-sdk/aa'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  ExternalKey,
  ExternalSignerController,
  KeystoreSignerInterface,
  SignMessageContext
} from '@ambire-common/interfaces/keystore'

import PQ1Controller from '../../controllers/PQ1Controller'
import { createPq1Bundler, pq1ChainReader, pq1Context } from '../pq1/context'
import { PQ1_SEND_FAILED_MESSAGE, toUserFacingPq1Error } from '../pq1/errors'

type TypedMessage = Parameters<KeystoreSignerInterface['signTypedData']>[0]

/** Ambire hands over ethers-style typed data; for valid EIP-712 input it is
 *  structurally what the SDK (viem) expects. */
const asPq1TypedData = (typedData: TypedMessage) => typedData as unknown as Pq1TypedData

const isAccountIndex = (n: unknown): n is number =>
  Number.isInteger(n) && (n as number) >= 0 && (n as number) <= MAX_ACCOUNT_INDEX

/**
 * Signing surface for a PQ1 hardware wallet account. The device protocol,
 * clear signing and the ERC-4337 pipeline live in `pq1-sdk`; this class
 * adapts them to Ambire's keystore.
 *
 * PQ1 is a smart-account-only signer (no EOA), so the EOA-style methods
 * (`signRawTransaction`, `sign7702`, `signTransactionTypeFour`) throw. The
 * caller is expected to route transaction signing through
 * `broadcastAccountOp` instead — see the `signingKeyType === 'pq1'` branch
 * in ambire-common's `SignAccountOpController`.
 *
 * Message signing (`signMessage`, `signTypedData`) produces an ERC-1271
 * wrapped signature: `abi.encode(uint256 ownerIndex, bytes innerSig)`, or
 * the device's ERC-6492 signature for a wallet not deployed on the chain
 * yet. Verifiers must call `PQSmartWallet.isValidSignature(hash, sig)` —
 * a SPHINCS+ signature is not ECDSA-recoverable.
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

  /** The connected, unlocked PQ1, checked to be the one this account came
   *  from. The background opens it through the permission the connect
   *  screen granted, so no user gesture is needed; a locked device asks for
   *  its PIN first, which is the correct UX. */
  async #acquireDevice(): Promise<Pq1Device> {
    if (!this.controller) {
      throw new ExternalSignerError(
        'The PQ1 signer could not start. Please reload the extension and try again.',
        { sendCrashReport: true }
      )
    }
    const device = await this.controller.getUnlockedDevice()
    // Another PQ1 would sign with its own keys for the same account number,
    // producing a signature that fails verification.
    if (this.controller.deviceId !== this.key.meta.deviceId) {
      throw new ExternalSignerError(
        'This account belongs to a different PQ1. Plug in the PQ1 you added it from, then try again.',
        { sendCrashReport: false }
      )
    }
    return device
  }

  /** Run a device operation with one automatic recovery pass: if the
   *  firmware idle-locks (2-minute timeout) between the pre-flight check
   *  and the command, the op fails with a 'locked' error *before* anything
   *  was signed — so we re-run the unlock flow (which triggers the on-device
   *  PIN prompt) and replay the operation once. Deliberate on-device
   *  rejections carry code 'rejected' and are never retried. */
  async #withDevice<T>(run: (device: Pq1Device) => Promise<T>): Promise<T> {
    const device = await this.#acquireDevice()
    try {
      return await run(device)
    } catch (e) {
      if (!isPq1Error(e) || e.code !== 'locked') throw e
      return run(await this.#acquireDevice())
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
      throw new ExternalSignerError(PQ1_ERROR_MESSAGES['unsupported-network'])
    }
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

  /** What the SDK's message signing needs, for the chain in `ctx`. */
  #signContext(ctx: SignMessageContext, device: Pq1Device): SignOffchainContext {
    return {
      ctx: pq1Context,
      device: device.commands,
      chain: pq1ChainReader(ctx.chainId, ctx.provider),
      accountIndex: this.#accountIndex(),
      sender: this.key.addr as `0x${string}`
    }
  }

  signMessage: KeystoreSignerInterface['signMessage'] = async (hex, ctx) => {
    const signCtx = this.#requireCtx(ctx, 'signMessage')
    this.#requireSupportedChain(signCtx.chainId, 'signMessage')
    try {
      // The device shows the message as text, or as hex when it isn't text;
      // one too long for its screen is signed as its EIP-191 hash.
      return await this.#withDevice((device) =>
        signPq1Message(this.#signContext(signCtx, device), { raw: hex as `0x${string}` })
      )
    } catch (e) {
      throw toUserFacingPq1Error(e)
    }
  }

  signTypedData: KeystoreSignerInterface['signTypedData'] = async (typedData, ctx) => {
    const signCtx = this.#requireCtx(ctx, 'signTypedData')
    this.#requireSupportedChain(signCtx.chainId, 'signTypedData')
    try {
      // The first route that fits: the device's own Safe transaction / CoW
      // order / Permit2 screens, an ERC-7730 descriptor, or the EIP-712 hash
      // signed blind. A request sent on one route is never retried on a
      // weaker one.
      return await this.#withDevice((device) =>
        signPq1TypedData(this.#signContext(signCtx, device), asPq1TypedData(typedData))
      )
    } catch (e) {
      throw toUserFacingPq1Error(e)
    }
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
   * and submits it to the bundler. Returns the userOpHash + EntryPoint
   * nonce — inclusion and per-op success are tracked by Ambire's
   * ActivityController via `identifiedBy: { type: 'UserOperation' }`.
   */
  broadcastAccountOp: NonNullable<KeystoreSignerInterface['broadcastAccountOp']> = async ({
    chainId,
    provider,
    calls,
    gasFeePayment
  }) => {
    this.#requireSupportedChain(chainId, 'broadcastAccountOp')
    const bundler = createPq1Bundler()
    if (!bundler) {
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
    const chain = pq1ChainReader(chainId, provider)
    try {
      // #withDevice may replay the whole pipeline once on a mid-flight
      // idle-lock. That's safe: a 'locked' error can only originate from
      // the device commands, which all happen before the UserOp is submitted
      // to the bundler — the retry just re-estimates and re-signs.
      return await this.#withDevice(async (device) => {
        const prepared = await prepareTransaction({
          chain,
          bundler,
          device: { getInitCode: (index, onChain) => device.getInitCode(index, Number(onChain)) },
          logger: pq1Context.logger,
          accountIndex: this.#accountIndex(),
          sender: this.key.addr as `0x${string}`,
          calls: calls.map((c) => ({
            to: c.to as `0x${string}`,
            value: c.value,
            data: c.data as `0x${string}`
          })),
          // Bind the UserOp's fee fields to what the user approved in the
          // fee UI — the charge must match the confirmation screen.
          fee: {
            maxFeePerGas: gasFeePayment.gasPrice,
            maxPriorityFeePerGas: gasFeePayment.maxPriorityFeePerGas ?? gasFeePayment.gasPrice
          }
        })
        const signed = await signPreparedTransaction({
          ctx: pq1Context,
          device: device.commands,
          prepared
        })
        const userOpHash = await submitUserOperation(bundler, prepared.chainId, signed)
        return { userOpHash, nonce: prepared.wallet.nonce }
      })
    } catch (e) {
      // A bundler rejection or an RPC failure goes on to
      // SignAccountOpController, which words it (and offers a fee refresh)
      // like any other broadcast failure. Everything else is worded here:
      // device states and refusals plainly, anything unexpected as a failed
      // send (and reported to Sentry).
      if (e instanceof BundlerError) throw e
      if (isPq1Error(e) && e.code === 'rpc' && e.cause instanceof Error) throw e.cause
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
