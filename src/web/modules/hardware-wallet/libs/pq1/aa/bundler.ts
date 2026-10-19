// A minimal Pimlico bundler client for PQ1 UserOps. Ambire's own bundler
// services (`@ambire-common/services/bundlers`) build EntryPoint v0.7
// UserOps for Ambire accounts; PQ1 wallets use EntryPoint v0.6 and only need
// these two calls.

import { fetchWithTimeout } from '@ambire-common/utils/fetch'

import { Pq1UserError } from '../errors'
import type { UserOpGasEstimate, UserOpJson } from './userop'

/** How long to wait for the bundler. */
const BUNDLER_TIMEOUT_MS = 30_000

/** Shown when the bundler doesn't answer a gas estimate: nothing was sent. */
const BUNDLER_UNREACHABLE_MESSAGE =
  "Ambire couldn't reach the service that sends PQ1 transactions. Check your internet connection and try again. Nothing was sent."

/** Shown when the bundler doesn't answer a send. It may have taken the
 *  transaction anyway, and a blind retry could send it a second time. */
const SEND_UNCONFIRMED_MESSAGE =
  "We couldn't confirm whether your transaction was sent. Wait a minute and check your balance before trying again, so it isn't sent twice."

/** eth_call-style state-override set passed as the optional 3rd param of
 *  `eth_estimateUserOperationGas`. Keyed by address; we only ever set `code`,
 *  but the full shape is allowed for completeness. */
export type StateOverride = Record<
  `0x${string}`,
  {
    code?: string
    balance?: string
    nonce?: string
    state?: Record<string, string>
    stateDiff?: Record<string, string>
  }
>

/** A JSON-RPC error from the bundler. Its message is the bundler's own (for
 *  example "AA21 didn't pay prefund"), which Ambire's broadcast error
 *  handling turns into words for the user. */
export class BundlerError extends Error {
  code: number

  data: unknown

  constructor(code: number, message: string, data?: unknown) {
    super(message)
    this.name = 'BundlerError'
    this.code = code
    this.data = data
  }
}

let nextId = 1

/** One JSON-RPC call to the bundler. A reply that is an error becomes a
 *  `BundlerError`; no reply at all (a timeout, a dropped connection, a body
 *  that isn't JSON) becomes a `Pq1UserError` with `noAnswerMessage`. */
async function rpcCall<T>(
  url: string,
  method: string,
  params: unknown[],
  noAnswerMessage: string
): Promise<T> {
  const id = nextId++
  const noAnswer = (e: unknown) =>
    new Pq1UserError(noAnswerMessage, `${method}: no answer from the bundler (${String(e)})`)
  let res: Response
  try {
    res = await fetchWithTimeout(
      fetch,
      url,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id, method, params })
      },
      BUNDLER_TIMEOUT_MS
    )
  } catch (e) {
    throw noAnswer(e)
  }
  if (!res.ok) {
    const text = await res.text().catch((e: unknown) => `(unreadable body: ${String(e)})`)
    throw new BundlerError(-32603, `HTTP ${res.status} from the bundler: ${text.slice(0, 200)}`)
  }
  const body = (await res.json().catch((e: unknown) => {
    throw noAnswer(e)
  })) as {
    result?: T
    error?: { code: number; message: string; data?: unknown }
  }
  if (body.error) {
    throw new BundlerError(body.error.code, body.error.message, body.error.data)
  }
  if (body.result === undefined) {
    throw new BundlerError(-32603, 'empty bundler response')
  }
  return body.result
}

/** The bundler calls a PQ1 send makes. There is no call that waits for a
 *  receipt on purpose: see `broadcast.ts`. */
export class BundlerClient {
  constructor(
    readonly url: string,
    readonly entryPoint: `0x${string}`
  ) {}

  /** The bundler's gas figures for `op`, simulated with `stateOverride`
   *  applied (used to stub the signature verifier, see `broadcast.ts`). */
  estimateUserOperationGas(
    op: UserOpJson,
    stateOverride?: StateOverride
  ): Promise<UserOpGasEstimate> {
    const params: unknown[] = [op, this.entryPoint]
    if (stateOverride) params.push(stateOverride)
    return rpcCall<UserOpGasEstimate>(
      this.url,
      'eth_estimateUserOperationGas',
      params,
      BUNDLER_UNREACHABLE_MESSAGE
    )
  }

  /** Submit `op`; resolves with its UserOp hash once the bundler accepts it.
   *  Without an answer the bundler may still have taken it, so the user is
   *  told the send is unconfirmed rather than failed. */
  sendUserOperation(op: UserOpJson): Promise<`0x${string}`> {
    return rpcCall<`0x${string}`>(
      this.url,
      'eth_sendUserOperation',
      [op, this.entryPoint],
      SEND_UNCONFIRMED_MESSAGE
    )
  }
}
