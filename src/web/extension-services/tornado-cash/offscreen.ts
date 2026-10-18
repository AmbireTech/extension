/**
 * The Tornado Cash offscreen document (Chrome only). The SDK always runs in Web Workers - its
 * store, the Merkle trees and the prover - which a service worker cannot start, so it lives here,
 * for one recovery phrase at a time. The background closes it when the account changes.
 *
 * It never gets the recovery phrase: every RPC call and note key is asked from the background,
 * which checks the key paths. It reaches the network only for its artifacts (same-origin), the
 * saga CDN and the bundler. Bundled under LavaMoat; the SDK's prebuilt workers are not.
 */
import { E_ADDRESS, TornadoCashConfigs, TornadoCashProtocol } from '@kohaku-eth/tornado-cash'

import {
  TORNADO_CASH_ACCOUNT_INDEX,
  TORNADO_CASH_ASSET_PATHS,
  TORNADO_CASH_CHAIN_ID,
  TORNADO_CASH_PAYMASTER,
  TORNADO_CASH_POOLS,
  TORNADO_CASH_SAGA_SYNC_URL,
  getTornadoCashBundlerUrl
} from '@ambire-common/consts/tornadoCash'
import type {
  TornadoCashNote,
  TornadoCashPaymasterWithdrawal,
  TornadoCashTx
} from '@ambire-common/interfaces/tornadoCash'
import { createSagaExternalSyncProvider } from '@ambire-common/libs/kohaku/sagaExternalSyncProvider'

import { createIdbStorage } from './idbStorage'
import {
  decodeTornadoCashValue,
  encodeTornadoCashValue,
  FromTornadoCashDocument,
  isTornadoCashPluginMethod,
  TORNADO_CASH_PORT_NAME,
  TornadoCashPluginMethod,
  TORNADO_CASH_PROVIDER_METHODS,
  ToTornadoCashDocument,
  TornadoCashProviderMethod
} from './protocol'

import type { Host } from '@kohaku-eth/plugins'
import type { EthereumProvider } from '@kohaku-eth/provider'

/**
 * Pools at least this many blocks behind are read from the saga CDN; the rest from the chain. A
 * cold sync is years behind, a warm one a few hundred blocks.
 */
const MIN_EXTERNAL_SYNC_BLOCKS = 10_000

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const port = chrome.runtime.connect({ name: TORNADO_CASH_PORT_NAME })
let isConnected = true

const send = (message: FromTornadoCashDocument) => {
  // The background may close the document while a call is running
  if (isConnected) port.postMessage(message)
}

let nextHostCallId = 0
const pendingHostCalls = new Map<
  number,
  { resolve: (result: unknown) => void; reject: (error: Error) => void }
>()

const callBackground = (message: (id: number) => FromTornadoCashDocument) =>
  new Promise<unknown>((resolve, reject) => {
    nextHostCallId += 1
    pendingHostCalls.set(nextHostCallId, { resolve, reject })
    send(message(nextHostCallId))
  })

const provider = Object.fromEntries(
  TORNADO_CASH_PROVIDER_METHODS.map((method: TornadoCashProviderMethod) => [
    method,
    (...args: unknown[]) =>
      callBackground((id) => ({
        type: 'provider',
        id,
        method,
        args: encodeTornadoCashValue(args)
      }))
  ])
) as unknown as EthereumProvider

const host: Host = {
  network: { fetch: (input, init) => fetch(input, init) },
  storage: createIdbStorage(),
  keystore: {
    deriveAt: async (path: string) =>
      (await callBackground((id) => ({ type: 'derive-key', id, path }))) as `0x${string}`
  },
  provider,
  externalSyncProvider: createSagaExternalSyncProvider(TORNADO_CASH_SAGA_SYNC_URL)
}

const loadArtifacts = async () => {
  const baseUrl = chrome.runtime.getURL(TORNADO_CASH_ASSET_PATHS.baseDir)
  const [circuit, provingKey] = await Promise.all([
    fetch(`${baseUrl}${TORNADO_CASH_ASSET_PATHS.circuit}`),
    fetch(`${baseUrl}${TORNADO_CASH_ASSET_PATHS.provingKey}`)
  ])
  if (!circuit.ok || !provingKey.ok)
    throw new Error('tornadoCash: the proving artifacts are missing from this build')

  return { circuitText: await circuit.text(), provingKey: await provingKey.arrayBuffer() }
}

// The class rather than `createTCPlugin`, whose return type makes every method optional
const plugin = new TornadoCashProtocol(host, {
  accountIndex: TORNADO_CASH_ACCOUNT_INDEX,
  protocolConfig: TornadoCashConfigs[Number(TORNADO_CASH_CHAIN_ID) as 1],
  // Ours, not the SDK's `TornadoPaymasterConfigs`, which swaps the USDC adapters
  paymasterConfig: {
    [Number(TORNADO_CASH_CHAIN_ID)]: {
      ...TORNADO_CASH_PAYMASTER,
      bundlerUrl: getTornadoCashBundlerUrl(TORNADO_CASH_CHAIN_ID),
      poolsAccountsMap: Object.fromEntries(
        TORNADO_CASH_POOLS.map(({ address, feeAdapterAddress }) => [address, feeAdapterAddress])
      )
    }
  },
  stateManagerWorkerUrl: chrome.runtime.getURL(
    `${TORNADO_CASH_ASSET_PATHS.baseDir}${TORNADO_CASH_ASSET_PATHS.stateManagerWorker}`
  ),
  artifactsLoader: loadArtifacts,
  minExternalSyncBlocksAmount: MIN_EXTERNAL_SYNC_BLOCKS
})

const toHexAddress = (address: bigint) => `0x${address.toString(16).padStart(40, '0')}`

/** The SDK's asset id: its native sentinel for ETH, the token otherwise. */
const toSdkAsset = (assetAddress: string) => ({
  __type: 'erc20' as const,
  contract: (assetAddress.toLowerCase() === ZERO_ADDRESS
    ? E_ADDRESS
    : assetAddress) as `0x${string}`
})

const methods: { [method in TornadoCashPluginMethod]: (params: never) => Promise<unknown> } = {
  sync: async () => {
    await plugin.sync()
  },
  notes: async (): Promise<TornadoCashNote[]> =>
    (await plugin.notes()).map((note) => ({
      poolAddress: toHexAddress(BigInt(note.pool)),
      amount: BigInt(note.amount),
      depositIndex: note.depositIndex,
      timestamp: Number(note.timestamp)
    })),
  prepareShield: async ({
    assetAddress,
    amount
  }: {
    assetAddress: string
    amount: bigint
  }): Promise<TornadoCashTx[]> => {
    const { txns } = await plugin.prepareShield({ asset: toSdkAsset(assetAddress), amount })

    return txns.map(({ to, data, value }) => ({ to, data, value: BigInt(value) }))
  },
  prepareUnshield: async ({
    assetAddress,
    amount,
    recipient
  }: {
    assetAddress: string
    amount: bigint
    recipient: string
  }): Promise<TornadoCashPaymasterWithdrawal[]> => {
    const { withdrawals } = await plugin.prepareUnshield(
      { asset: toSdkAsset(assetAddress), amount },
      recipient as `0x${string}`,
      // Deterministic: the batch signer is derived from the phrase, so leftovers stay recoverable
      { mode: 'paymaster', delegation: { mode: 'deterministic' } }
    )

    return withdrawals.map((withdrawal) => {
      if (withdrawal.mode !== 'paymaster' || !('userOperation' in withdrawal))
        throw new Error('tornadoCash: the SDK built a withdrawal of an unexpected kind')

      return {
        poolAddress: toHexAddress(BigInt(withdrawal.poolAddress)),
        entryPointAddress: withdrawal.entryPointAddress,
        userOperation: withdrawal.userOperation
      }
    })
  }
}

const answerCall = async (message: Extract<ToTornadoCashDocument, { type: 'call' }>) => {
  try {
    if (!isTornadoCashPluginMethod(message.method))
      throw new Error('tornadoCash: the background called an unknown method')

    const [params] = decodeTornadoCashValue(message.args) as [never]
    const result = await methods[message.method](params)

    send({ type: 'result', id: message.id, result: encodeTornadoCashValue(result) })
  } catch (error: any) {
    // Logged here only for a withdrawal: an error from proving can reveal the note's secrets
    console.error(`tornadoCash: ${message.method} failed`, error)
    send({
      type: 'failed',
      id: message.id,
      message:
        message.method === 'prepareUnshield' ? undefined : String(error?.message ?? 'Unknown error')
    })
  }
}

port.onMessage.addListener((message: ToTornadoCashDocument) => {
  if (message?.type === 'call') {
    answerCall(message).catch((error) => {
      console.error('tornadoCash: a call could not be answered', error)
    })
    return
  }

  if (message?.type !== 'host-result' && message?.type !== 'host-failed') {
    console.error('tornadoCash: the document received an unexpected message')
    return
  }

  const pending = pendingHostCalls.get(message.id)
  if (!pending) return
  pendingHostCalls.delete(message.id)

  if (message.type === 'host-result') pending.resolve(decodeTornadoCashValue(message.result))
  else pending.reject(new Error('tornadoCash: the background could not answer'))
})

// The background never reopens a port, so once it is gone this document is useless
port.onDisconnect.addListener(() => {
  isConnected = false
  pendingHostCalls.forEach(({ reject }) => reject(new Error('tornadoCash: the background left')))
  pendingHostCalls.clear()
  window.close()
})

// The SDK starts its worker in the constructor but exposes no readiness, so a worker that fails to
// start makes the first call fail instead. Constructing it is what can throw here.
send({ type: 'ready' })
