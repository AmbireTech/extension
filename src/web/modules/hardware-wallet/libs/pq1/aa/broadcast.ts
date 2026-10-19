// Sending a transaction from a PQ1 account: the AccountOp's calls become one
// ERC-4337 UserOperation (EntryPoint v0.6), signed on the device and sent to
// the bundler.
//
// Ambire's `SignAccountOpController` calls `PQ1Signer.broadcastAccountOp`
// for PQ1 keys instead of building an Ambire UserOp (its bundler setup
// expects ECDSA signatures), and that calls `pq1BroadcastAccountOp`. The
// UserOp hash goes back as soon as the bundler accepts the UserOp: Ambire's
// ActivityController then tracks it like any other UserOp
// (`identifiedBy: { type: 'UserOperation' }`), including a reverted inner
// call. Waiting for the receipt here would report a slow-but-included
// UserOp as failed, and a user retrying it could pay twice.

import type { JsonRpcProvider } from 'ethers'

import { captureException } from '@common/config/analytics/CrashAnalytics.web'

import {
  ENTRY_POINT_V06,
  ESTIMATE_PLACEHOLDER_GAS,
  FACTORY,
  MAX_BATCH_TXS,
  MAX_TX_LEN,
  pimlicoBundlerUrl,
  PQ1_SUPPORTED_CHAIN_IDS,
  VERIFICATION_GAS_LIMIT,
  VERIFIER_STUB_RETURN_TRUE_CODE
} from '../config'
import {
  PQ1_UNSUPPORTED_NETWORK_MESSAGE,
  Pq1UserError,
  TOO_LARGE_FOR_DEVICE_MESSAGE
} from '../errors'
import { hexToBytes } from '../transport/bytes'
import type { DeviceCommands } from '../transport/commands'
import type { SignBundle } from '../transport/signResponse'
import { parseCallBigInt, resolvePq1AccountState, type Pq1AccountState } from './accountState'
import { BundlerClient } from './bundler'
import { buildCallTrailers } from './callTrailers'
import {
  decodeC10Verifier,
  decodeGetAddress,
  encodeC10Verifier,
  encodeExecute,
  encodeExecuteBatch,
  encodeGetAddress,
  encodeGetNonce,
  encodeOffchainSigCount
} from './contracts'
import { parseInitCode } from './factory'
import { fitFeesForDeviceDisplay } from './feeDisplay'
import { applyEstimate, buildUserOp, finalize, forEstimate, type UserOpJson } from './userop'

type Call = { to: `0x${string}`; value: bigint; data: `0x${string}` }

/** Shown when the PQ1's firmware would deploy the account to a different
 *  address than this wallet build expects (factory or init-code drift). */
const FIRMWARE_MISMATCH_MESSAGE =
  "This PQ1's software doesn't match this version of Ambire, so your account can't be set up on this network yet. Update the PQ1 firmware or Ambire, then try again."

/** Refuse a request with more calls than one PQ1 signature can cover, with a
 *  message the user understands (a dapp batch, for example), before any
 *  device or network work starts. */
export function assertPq1CallCount(calls: readonly unknown[]): void {
  if (calls.length <= MAX_BATCH_TXS) return
  throw new Pq1UserError(
    `A PQ1 can approve up to ${MAX_BATCH_TXS} actions in one transaction, and this request has ${calls.length}. Try again in smaller parts.`,
    `${calls.length} calls > MAX_BATCH_TXS (${MAX_BATCH_TXS})`
  )
}

/** Refuse a call whose data is longer than the device takes for one call,
 *  with a message the user understands, before any device or network work. */
function assertPq1CallDataFits(calls: readonly { data: `0x${string}` }[]): void {
  const longest = Math.max(0, ...calls.map((call) => (call.data.length - 2) / 2))
  if (longest <= MAX_TX_LEN) return
  throw new Pq1UserError(
    TOO_LARGE_FOR_DEVICE_MESSAGE,
    `call data of ${longest} bytes > MAX_TX_LEN (${MAX_TX_LEN})`
  )
}

export type PQ1BroadcastParams = {
  /** The account number on the device. */
  accountIndex: number
  /** The PQ1 wallet sending the calls. */
  sender: `0x${string}`
  chainId: number
  calls: Call[]
  /** Pimlico API key — fed in from the host extension's env. */
  pimlicoApiKey: string
  /** Provider used for read calls (getCode, getNonce, nextOwnerIndex). The
   *  caller in signAccountOp passes through its own JsonRpcProvider so the
   *  same RPC settings/headers apply. */
  provider: JsonRpcProvider
  /** The unlocked device (`PQ1Controller.walletSDK.commands`). */
  device: DeviceCommands
  /** The fee the user approved in Ambire's fee UI. The UserOp is submitted
   *  with these fee-per-gas values; only the cap may be rounded up, by less
   *  than 10^4 wei, so the device can show the fee exactly (see
   *  `fitFeesForDeviceDisplay`). The priority fee and the price paid are
   *  unchanged. */
  fee: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }
}

export type PQ1BroadcastResult = {
  userOpHash: `0x${string}`
  /** EntryPoint nonce the op was submitted with. */
  nonce: bigint
}

/** The wallet's on-chain state a UserOp is built from. */
type WalletState = Pq1AccountState & {
  /** The EntryPoint nonce. */
  nonce: bigint
  /** The SPHINCS+ verifier contract, or null when it couldn't be read. */
  verifier: string | null
  /** The wallet's count of off-chain signatures for the active owner. */
  onchainOffchainCount: bigint
}

/**
 * Send `calls` from a PQ1 wallet as one UserOp:
 *   1. read the wallet's state;
 *   2. raise the device's off-chain signature count to the wallet's;
 *   3. on its first transaction, get the wallet's init code from the device;
 *   4. estimate the gas, and fit the fee to the device's screen;
 *   5. have the device sign it, with each call's clear-signing bundles;
 *   6. submit it with the device's signature and return its hash.
 */
export async function pq1BroadcastAccountOp(
  params: PQ1BroadcastParams
): Promise<PQ1BroadcastResult> {
  const { chainId, calls, device } = params
  // Fail fast with a clear message on chains where the PQ1 contracts
  // (factory, verifier, EntryPoint wiring) are not deployed. Without this
  // guard the pipeline dies much later in gas estimation with a generic
  // error that doesn't tell the user the chain is the problem.
  if (!PQ1_SUPPORTED_CHAIN_IDS.includes(chainId)) {
    throw new Pq1UserError(
      PQ1_UNSUPPORTED_NETWORK_MESSAGE,
      `chain ${chainId} is not in PQ1_SUPPORTED_CHAIN_IDS (${PQ1_SUPPORTED_CHAIN_IDS.join(', ')})`
    )
  }
  assertPq1CallCount(calls)
  assertPq1CallDataFits(calls)
  const bundler = new BundlerClient(
    pimlicoBundlerUrl(chainId, params.pimlicoApiKey),
    ENTRY_POINT_V06
  )

  // 1.
  const wallet = await readWalletState(params.provider, params.sender)

  // 2. The device writes its own off-chain count into the UserOp's
  // callData, and the wallet reverts a count below its own — after the
  // UserOp has paid its fee. Raising the device's count first keeps it at
  // least the wallet's, even after a firmware reflash wiped the device's
  // counters; the device asks the user to confirm a raise. A device error
  // here (locked, unplugged, declined) stops the send.
  if (wallet.onchainOffchainCount > 0n) {
    await device.offchainSync({
      accountIndex: params.accountIndex,
      chainId,
      slotIndex: wallet.slotIndex,
      targetCount: wallet.onchainOffchainCount
    })
  }

  // 3.
  const initCode = wallet.isDeployed ? new Uint8Array(0) : await firstDeploymentInitCode(params)

  // 4. The estimate's callData carries the wallet's count, so the wallet
  // accepts it; the device's (at least as high) replaces it in step 6.
  const unsignedOp = fitFeesForDeviceDisplay(
    await estimateUserOp(bundler, {
      sender: params.sender,
      wallet,
      initCode,
      callData: encodeWalletCall(wallet.ownerIndex, wallet.onchainOffchainCount, calls),
      fee: params.fee
    })
  )

  // 5.
  const signed = await signOnDevice(params, wallet, unsignedOp, !wallet.isDeployed)

  // 6.
  const op = finalize(
    {
      ...unsignedOp,
      callData: encodeWalletCall(wallet.ownerIndex, signed.newOffchainCount, calls)
    },
    { initCode: signed.initCode, signature: signed.type2 }
  )
  const userOpHash = await bundler.sendUserOperation(op)
  return { userOpHash, nonce: wallet.nonce }
}

/** Deploy status, active owner, EntryPoint nonce, verifier and off-chain
 *  count of the wallet `sender`. The independent reads run in parallel. */
async function readWalletState(
  provider: JsonRpcProvider,
  sender: `0x${string}`
): Promise<WalletState> {
  const [accountState, nonceHex, verifier] = await Promise.all([
    resolvePq1AccountState(provider, sender),
    provider.call({ to: ENTRY_POINT_V06, data: encodeGetNonce(sender) }),
    readVerifier(provider)
  ])
  const onchainOffchainCount = accountState.isDeployed
    ? await readOffchainSigCount(provider, sender, accountState.ownerIndex)
    : 0n
  return {
    ...accountState,
    nonce: parseCallBigInt(nonceHex, 'EntryPoint getNonce'),
    verifier,
    onchainOffchainCount
  }
}

/** The SPHINCS+ verifier contract. It is read from the factory, which is
 *  deployed even when the wallet isn't yet. Null when the read fails: the
 *  estimate then fails and the send is refused, rather than sent with
 *  too little gas. */
async function readVerifier(provider: JsonRpcProvider): Promise<string | null> {
  try {
    const result = await provider.call({ to: FACTORY, data: encodeC10Verifier() })
    return decodeC10Verifier(result as `0x${string}`)
  } catch (e) {
    captureException(e)
    console.warn('[pq1] could not read the SPHINCS+ verifier for gas estimation', e)
    return null
  }
}

/** The wallet's `offchainSigCount` for `ownerIndex`, or 0 when the read
 *  fails. 0 is right for a fresh wallet; for one that has signed off-chain
 *  messages the estimate then fails and the send is refused before signing. */
async function readOffchainSigCount(
  provider: JsonRpcProvider,
  sender: `0x${string}`,
  ownerIndex: bigint
): Promise<bigint> {
  try {
    const result = await provider.call({ to: sender, data: encodeOffchainSigCount(ownerIndex) })
    return BigInt(result || '0x0')
  } catch (e) {
    captureException(e)
    console.warn('[pq1] reading the off-chain signature count failed', e)
    return 0n
  }
}

/**
 * The init code that deploys the wallet, from the device.
 *
 * The estimate needs the real init code: a placeholder fails the factory
 * (two identical zero keys) or deploys to another address. The device
 * returns it without asking the user to confirm, and it is byte for byte
 * what SIGN_USEROP puts in the deploying UserOp.
 *
 * The firmware derives the wallet address from its own copy of the factory
 * address and the wallet's init-code hash. If either differs from what is
 * deployed on this chain, the EntryPoint would refuse the deployment with an
 * opaque error, so both are checked here: the init code must call our
 * factory, and the factory must agree the device's keys deploy to `sender`.
 */
async function firstDeploymentInitCode(params: PQ1BroadcastParams): Promise<Uint8Array> {
  // Each GET_INIT_CODE spends a signature of the wallet's few-time bootstrap
  // key, so none is asked for on a chain the factory isn't deployed on.
  if ((await params.provider.getCode(FACTORY)) === '0x') {
    throw new Pq1UserError(
      PQ1_UNSUPPORTED_NETWORK_MESSAGE,
      `factory ${FACTORY} has no code on chain ${params.chainId}`
    )
  }
  const initCode = await params.device.getInitCode(params.accountIndex, params.chainId)
  const fields = parseInitCode(initCode)
  if (!fields || fields.factory.toLowerCase() !== FACTORY.toLowerCase()) {
    captureException(
      new Error(
        `[pq1] firmware initCode targets factory ${fields?.factory ?? '(unparseable initCode)'}, expected ${FACTORY}`
      )
    )
    throw new Pq1UserError(FIRMWARE_MISMATCH_MESSAGE)
  }
  const predictedHex = await params.provider.call({
    to: FACTORY,
    data: encodeGetAddress(fields.masterPkSeed, fields.masterPkRoot)
  })
  const predicted = decodeGetAddress(predictedHex as `0x${string}`)
  if (predicted.toLowerCase() !== params.sender.toLowerCase()) {
    captureException(
      new Error(
        `[pq1] device reports sender ${params.sender}, factory on chain ${params.chainId} predicts ${predicted}`
      )
    )
    throw new Pq1UserError(FIRMWARE_MISMATCH_MESSAGE)
  }
  return initCode
}

/**
 * The UserOp with the bundler's gas estimate and the approved fee.
 *
 * Estimation runs with a placeholder signature, which can't pass a real
 * SPHINCS+ check — and the wallet only lets its execute functions run after
 * a passing check, so the simulated execution would revert and the bundler
 * couldn't estimate the call gas. So the verifier contract is replaced, for
 * the simulation only, by a stub that accepts any signature. Execution never
 * calls the verifier, so the call gas stays exact; the verification gas is
 * the fixed `VERIFICATION_GAS_LIMIT` anyway.
 */
async function estimateUserOp(
  bundler: BundlerClient,
  args: {
    sender: `0x${string}`
    wallet: WalletState
    initCode: Uint8Array
    callData: `0x${string}`
    fee: PQ1BroadcastParams['fee']
  }
): Promise<UserOpJson> {
  const { wallet } = args
  const opForEstimate = forEstimate(
    buildUserOp({
      sender: args.sender,
      nonce: wallet.nonce,
      initCode: args.initCode,
      callData: args.callData,
      callGasLimit: ESTIMATE_PLACEHOLDER_GAS.callGas,
      verificationGasLimit: VERIFICATION_GAS_LIMIT,
      preVerificationGas: wallet.isDeployed
        ? ESTIMATE_PLACEHOLDER_GAS.preVerificationGas
        : ESTIMATE_PLACEHOLDER_GAS.preVerificationGasFirstDeploy,
      maxFeePerGas: args.fee.maxFeePerGas,
      maxPriorityFeePerGas: args.fee.maxPriorityFeePerGas,
      // `forEstimate` puts in the placeholder signature.
      signature: new Uint8Array(0)
    }),
    wallet.ownerIndex
  )
  const verifierStub = wallet.verifier
    ? { [wallet.verifier.toLowerCase() as `0x${string}`]: { code: VERIFIER_STUB_RETURN_TRUE_CODE } }
    : undefined
  try {
    const estimate = await bundler.estimateUserOperationGas(opForEstimate, verifierStub)
    return {
      ...applyEstimate(opForEstimate, estimate),
      verificationGasLimit: `0x${VERIFICATION_GAS_LIMIT.toString(16)}`
    }
  } catch (e) {
    // Even with the stub, the estimate failed: the UserOp would revert or
    // run out of gas on-chain, or the bundler is down. Sending it with
    // guessed limits would most likely fail and still cost a fee, so the
    // send is refused instead.
    captureException(e)
    console.warn('[pq1] eth_estimateUserOperationGas failed', e)
    throw new Pq1UserError(
      "This transaction can't be sent because it would most likely fail on the network, which would still cost you a fee. Nothing was sent.",
      'eth_estimateUserOperationGas failed; not broadcasting to avoid an out-of-gas UserOp'
    )
  }
}

/** Attach each call's clear-signing bundles and have the device sign the
 *  UserOp: SIGN_USEROP for one call, SIGN_USEROP_BATCH for more. */
async function signOnDevice(
  params: PQ1BroadcastParams,
  wallet: WalletState,
  op: UserOpJson,
  includeInitCode: boolean
): Promise<SignBundle> {
  const { perCallTrailers, nameBundles } = await buildCallTrailers({
    chainId: params.chainId,
    sender: params.sender,
    calls: params.calls
  })
  const header = {
    chainId: params.chainId,
    accountIndex: params.accountIndex,
    slotIndex: wallet.slotIndex,
    includeInitCode,
    sender: params.sender,
    nonce: wallet.nonce,
    callGas: BigInt(op.callGasLimit),
    verGas: BigInt(op.verificationGasLimit),
    preVerificationGas: BigInt(op.preVerificationGas),
    maxFeePerGas: BigInt(op.maxFeePerGas),
    maxPriorityFeePerGas: BigInt(op.maxPriorityFeePerGas)
  }
  const calls = params.calls.map((c, i) => ({
    to: c.to,
    value: c.value,
    data: hexToBytes(c.data),
    ...perCallTrailers[i]
  }))
  return calls.length === 1
    ? params.device.signUserOp({ ...header, ...calls[0]!, nameBundles })
    : params.device.signUserOpBatch({ ...header, calls, nameBundles })
}

/** The wallet call that runs `calls`: `executeWithOffchainCount` for one,
 *  `executeBatchWithOffchainCount` for several. */
function encodeWalletCall(
  ownerIndex: bigint,
  offchainCount: bigint,
  calls: readonly Call[]
): `0x${string}` {
  if (calls.length === 1) {
    const c = calls[0]!
    return encodeExecute(ownerIndex, offchainCount, c.to, c.value, c.data)
  }
  return encodeExecuteBatch(
    ownerIndex,
    offchainCount,
    calls.map((c) => c.to),
    calls.map((c) => c.value),
    calls.map((c) => c.data)
  )
}
