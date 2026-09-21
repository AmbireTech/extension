/**
 * Builds the Privacy Pools state snapshots the extension ships as `initialState`.
 *
 * A cold sync walks every pool's whole history in 5000-block steps, which takes a quarter of an
 * hour on Ethereum. This does that walk once, here, and writes the result so the extension starts
 * from it instead. What it writes is the plugin's own `dumpState()` output - the SDK produces the
 * format, so there is nothing to keep in step with its internals.
 *
 * Re-runs are cheap. An existing snapshot is fed back in as the starting point, so a refresh only
 * covers the blocks since the last one.
 *
 * Nothing personal goes in. The plugin strips its user secrets before dumping, and the mnemonic
 * below exists only because the SDK wants a keystore in its host - the snapshot is the public
 * history of the pools, identical for every user.
 *
 * Usage:
 *   node scripts/build-privacy-pools-snapshot.mjs            # every supported chain
 *   node scripts/build-privacy-pools-snapshot.mjs 1          # just Ethereum
 *
 * Needs REACT_APP_HYPERSYNC_API_KEY in .env - the wallet's own RPC caps log queries at 5000 blocks,
 * which is the thing this script exists to avoid. A full build is a couple of hundred calls, so it
 * costs well under the billing minimum; refreshes are a handful.
 */

import 'dotenv/config'

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { register } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// The SDK's ESM has an extensionless import that only a bundler resolves. Registered before the
// SDK is loaded, which is why that import is dynamic and below this line.
register(
  `data:text/javascript,export async function resolve(s, c, next) {
     return next(s.startsWith('maci-crypto/') && !s.endsWith('.js') ? s + '.js' : s, c)
   }`
)

const { OxBowAspService, PrivacyPoolsV1Protocol, PrivacyPoolsV1_0xBow } = await import(
  '@kohaku-eth/privacy-pools'
)
const { LeanIMT } = await import('@zk-kit/lean-imt')
const { poseidon } = await import('maci-crypto/build/ts/hashing.js')

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
// Beside the other static build assets, so webpack copies them out rather than parsing several
// megabytes of JSON into the bundle - the same treatment the circuit artifacts get.
const OUT_DIR = join(ROOT_DIR, 'src/web/public/privacy-pools-snapshots')

/** 0xBow run a separate association-set deployment per chain, and neither is discoverable. */
const ASP_URLS = { 1: 'https://api.0xbow.io', 11155111: 'https://dw.0xbow.io' }

/**
 * Where contract reads go, since HyperSync serves logs and blocks but not `eth_call`.
 *
 * The wallet's own endpoints. Their 5000-block cap on log queries does not matter here - no log
 * query is sent to them.
 */
const CALL_RPC_URLS = {
  1: 'https://invictus.ambire.com/ethereum',
  11155111: 'https://invictus.ambire.com/sepolia'
}

/**
 * How far behind the chain tip a snapshot stops.
 *
 * A leaf that a reorg later drops would be baked into every copy of the snapshot, and the root it
 * produces would then match nothing on chain - so every user's sync would fail verification until
 * the next release. Two epochs is past where that happens.
 */
const FINALITY_LAG_BLOCKS = 64n

/**
 * Blocks per log query.
 *
 * Measured against the busiest address on Ethereum: 750k answers in a few seconds, 1.5M is refused
 * as a server-side timeout.
 */
const WINDOW_BLOCKS = 750_000n

/**
 * The narrowest window worth keeping.
 *
 * Below the plugin's own step size there is nothing left to coalesce, and a service that cannot
 * answer even this is not one the build can use.
 */
const MIN_WINDOW_BLOCKS = 5_000n

/** Only ever used to satisfy the host's keystore. Nothing derived from it reaches the snapshot. */
const THROWAWAY_MNEMONIC_KEY = `0x${'11'.repeat(32)}`

const API_KEY = process.env.REACT_APP_HYPERSYNC_API_KEY
const toQuantity = (value) => `0x${BigInt(value).toString(16)}`

const sleep = (ms) => new Promise((done) => setTimeout(done, ms))

/**
 * How long a single request may take before it is abandoned.
 *
 * A wide log query is the slowest thing here and answers in a few seconds; anything still open
 * after a minute is not coming back, and without this the whole build would hang on it.
 */
const REQUEST_TIMEOUT_MS = 60_000

/**
 * Backoff for a rate limit or a transient fault, doubling each time.
 *
 * Short, because the paid tier bills per call rather than throttling: a full build is a couple of
 * hundred calls, so a refusal is an exception to ride out rather than the pace to keep. A long
 * `Retry-After` is honoured only up to `MAX_BACKOFF_MS` - this is run by hand, and a two-minute
 * stall is worse than a retry that turns out to be early.
 */
const BASE_BACKOFF_MS = 2_000
const MAX_BACKOFF_MS = 20_000
const MAX_ATTEMPTS = 5

const rpc = async (url, method, params = []) => {
  let delay = BASE_BACKOFF_MS

  const backoff = async (reason, waitMs) => {
    const capped = waitMs > MAX_BACKOFF_MS ? MAX_BACKOFF_MS : waitMs
    console.log(`  ${reason} on ${method}, retrying in ${(capped / 1000).toFixed(1)}s`)
    await sleep(capped)
    delay *= 2
  }

  for (let attempt = 1; ; attempt += 1) {
    const isLastAttempt = attempt >= MAX_ATTEMPTS
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
      })

      if ((response.status === 429 || response.status >= 500) && !isLastAttempt) {
        // `Retry-After` when the service says how long, our own backoff when it does not.
        const retryAfter = Number(response.headers.get('retry-after'))
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delay

        await backoff(response.status, waitMs)
        continue
      }

      if (!response.ok) throw new Error(`${method} responded ${response.status}`)

      const body = await response.json()
      if (body.error) throw new Error(`${method}: ${body.error.message}`)

      return body.result
    } catch (error) {
      // A timeout or a dropped connection is worth one more go; a refusal the service explained is
      // not, since repeating the same query will be refused the same way.
      const isTransport = error.name === 'AbortError' || error.name === 'TypeError'
      if (!isTransport || isLastAttempt) throw error

      await backoff(error.name === 'AbortError' ? 'timeout' : 'network error', delay)
    } finally {
      clearTimeout(timeout)
    }
  }
}

/**
 * The host's view of the chain, split across two endpoints.
 *
 * HyperSync answers log queries in ranges wide enough to cover a chain in a handful, but it is not
 * a full node - `eth_call` comes back as "method not found". So contract reads, which the plugin
 * needs for token metadata and for checking its tree against the pools, go to an ordinary RPC.
 * This mirrors the split in the extension, where only `getLogs` leaves the wallet's own provider.
 *
 * Two further departures from a plain passthrough:
 *
 * `getBlockNumber` reports the finality-lagged tip rather than the real one, which is how the
 * snapshot is kept clear of reorgs - the plugin has no setting for where to stop.
 *
 * `getLogs` answers the plugin's 5000-block steps out of one much wider query, since the steps run
 * forward over one address at a time and are therefore predictable. Same idea as the extension's
 * own adapter, kept separate because this one may be as slow and as simple as it likes.
 */
const createProvider = (logUrl, callUrl, headBlock) => {
  // Narrowed in place when the service refuses a width, and kept for the rest of the run.
  let windowBlocks = WINDOW_BLOCKS
  // Keyed by address, not a single slot: the plugin scans every pool at once, and one shared slot
  // would have each pool overwrite the window the others are reading from. That fails silently -
  // a pool ends up with no leaves, and the root check skips pools that have none.
  const windows = new Map()
  const inFlight = new Map()

  return {
    _internal: null,
    getChainId: async () => BigInt(await rpc(callUrl, 'eth_chainId')),
    getBlockNumber: async () => headBlock,
    getCode: (address) => rpc(callUrl, 'eth_getCode', [address, 'latest']),
    getBalance: async (address) =>
      BigInt(await rpc(callUrl, 'eth_getBalance', [address, 'latest'])),
    getGasPrice: async () => BigInt(await rpc(callUrl, 'eth_gasPrice')),
    getTransactionCount: async (address) =>
      BigInt(await rpc(callUrl, 'eth_getTransactionCount', [address, 'latest'])),
    request: ({ method, params }) => rpc(callUrl, method, params ?? []),
    call: (params) =>
      rpc(callUrl, 'eth_call', [
        { to: params.to, from: params.from, data: params.input, value: params.value },
        'latest'
      ]),
    estimateGas: async (params) =>
      BigInt(await rpc(callUrl, 'eth_estimateGas', [{ to: params.to, data: params.input }])),
    waitForTransaction: async () => undefined,
    getTransactionReceipt: async () => null,

    async getLogs({ address, fromBlock, toBlock }) {
      const from = BigInt(fromBlock)
      const to = BigInt(toBlock ?? headBlock)
      const key = String(address).toLowerCase()

      const covers = (w) => w && from >= w.from && to <= w.to

      /**
       * Fetches a window, narrowing until the service will answer one.
       *
       * A wide query on a busy pool comes back as "Query timed out" rather than a refusal about
       * width, and the same width that worked a minute ago can fail now - so the width is found
       * per run rather than assumed. Once narrowed it stays narrowed, since a service that just
       * timed out will not do better on the next pool.
       */
      const fetchWindow = async () => {
        for (;;) {
          let end = from + windowBlocks
          if (end > headBlock) end = headBlock
          // The step the plugin asked for always wins, so it is never served a partial range.
          if (end < to) end = to

          try {
            const logs = await rpc(logUrl, 'eth_getLogs', [
              { address: key, fromBlock: toQuantity(from), toBlock: toQuantity(end) }
            ])

            windows.set(key, {
              from,
              to: end,
              logs: logs.map((log) => ({
                blockNumber: BigInt(log.blockNumber),
                topics: [...log.topics],
                data: log.data,
                address: log.address
              }))
            })

            return
          } catch (error) {
            const canNarrow = windowBlocks > MIN_WINDOW_BLOCKS && end > to

            if (!canNarrow) throw error

            windowBlocks /= 2n
            if (windowBlocks < MIN_WINDOW_BLOCKS) windowBlocks = MIN_WINDOW_BLOCKS

            console.log(`  ${error.message} - narrowing the window to ${windowBlocks} blocks`)
          }
        }
      }

      if (!covers(windows.get(key))) {
        // One fetch per address at a time, so concurrent steps over the same pool wait for the
        // window rather than racing to replace it.
        if (!inFlight.has(key)) {
          inFlight.set(
            key,
            fetchWindow().finally(() => inFlight.delete(key))
          )
        }

        await inFlight.get(key)
      }

      const window = windows.get(key)
      if (!covers(window))
        throw new Error(`window for ${key} does not cover ${from}-${to}, refusing to return a gap`)

      return window.logs.filter((log) => log.blockNumber >= from && log.blockNumber <= to)
    }
  }
}

/** `currentRoot()`, the root the pool contract itself reports. */
const CURRENT_ROOT_SELECTOR = '0xfdab463d'

/**
 * Pads a pool address back to twenty bytes.
 *
 * The plugin stores addresses as numbers, so serialising drops any leading zero byte and an
 * address like `0x05e4...` comes back as `0x5e4...`. Fine as a key, rejected as an address.
 */
const toAddress = (hex) => `0x${BigInt(hex).toString(16).padStart(40, '0')}`

/**
 * Checks every registered pool, not just the ones that happen to have leaves.
 *
 * The plugin's own `verifyRootsThunk` skips a pool whose leaf set is empty, so a pool that was
 * missed entirely passes it without complaint - which is exactly how a snapshot missing its largest
 * pool once reached disk looking healthy. Here an empty pool is the failure, not an exemption.
 */
const assertSnapshotIsComplete = async (state, callUrl) => {
  const chainState = Object.values(state)[0]
  const leavesByPool = new Map(chainState.poolsLeaves.poolLeavesTuples)
  const problems = []

  for (const [, rawPool] of chainState.pools.poolsTuples) {
    const pool = typeof rawPool === 'string' ? JSON.parse(rawPool) : rawPool
    const leaves = leavesByPool.get(pool.address) || []

    if (!leaves.length) {
      problems.push(`${pool.address}: no leaves at all`)
      continue
    }

    const sorted = [...leaves].sort((a, b) => Number(BigInt(a[0]) - BigInt(b[0])))
    const indexes = sorted.map(([index]) => BigInt(index))

    // On-chain leaf indexes start at 1 and never skip, so a gap means a window was missed.
    const hasGap = indexes.some((index, position) => index !== BigInt(position + 1))
    if (hasGap) {
      problems.push(`${pool.address}: leaf indexes are not contiguous from 1 (${indexes.length})`)
      continue
    }

    const tree = new LeanIMT((a, b) => poseidon([a, b]))
    tree.insertMany(sorted.map(([, leaf]) => BigInt(leaf.commitment)))

     
    const onChainRoot = BigInt(
      await rpc(callUrl, 'eth_call', [
        { to: toAddress(pool.address), data: CURRENT_ROOT_SELECTOR },
        'latest'
      ])
    )

    if (tree.root !== onChainRoot)
      problems.push(
        `${pool.address}: ${indexes.length} leaves hash to ${tree.root}, chain reports ${onChainRoot}`
      )
  }

  if (problems.length) throw new Error(`snapshot is incomplete:\n  ${problems.join('\n  ')}`)

  console.log(`  verified ${chainState.pools.poolsTuples.length} pools against the chain`)
}

/** The snapshot already on disk, or nothing on a first run. */
const readExistingSnapshot = async (path) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch {
    return null
  }
}

const buildChainSnapshot = async (chainId) => {
  const config = PrivacyPoolsV1_0xBow[chainId]
  if (!config) throw new Error(`chain ${chainId} is not a Privacy Pools deployment`)

  const logUrl = `https://${chainId}.rpc.hypersync.xyz/${API_KEY}`
  const callUrl = CALL_RPC_URLS[chainId]
  if (!callUrl) throw new Error(`chain ${chainId} has no RPC configured for contract reads`)

  const outPath = join(OUT_DIR, `state.${chainId}.json`)
  const existing = await readExistingSnapshot(outPath)

  const tip = BigInt(await rpc(callUrl, 'eth_blockNumber'))
  const headBlock = tip - FINALITY_LAG_BLOCKS
  const provider = createProvider(logUrl, callUrl, headBlock)

  const from = existing
    ? BigInt(Object.values(existing)[0]?.sync?.lastSyncedBlock ?? 0)
    : config.entrypoint.deploymentBlock

  console.log(
    `chain ${chainId}: ${existing ? 'refreshing' : 'building'} ` +
      `blocks ${from} -> ${headBlock} (tip ${tip}, lagged by ${FINALITY_LAG_BLOCKS})`
  )

  const host = {
    network: { fetch: (input, init) => fetch(input, init) },
    storage: { _brand: 'Storage', get: async () => null, set: async () => undefined },
    keystore: { deriveAt: async () => THROWAWAY_MNEMONIC_KEY },
    provider
  }

  const protocol = new PrivacyPoolsV1Protocol(host, {
    accountIndex: 0,
    initialState: existing ? async () => existing : undefined,
    entrypoint: {
      address: BigInt(config.entrypoint.entrypointAddress),
      deploymentBlock: config.entrypoint.deploymentBlock
    },
    aspServiceFactory: () =>
      new OxBowAspService({ network: host.network, aspUrl: ASP_URLS[chainId] })
  })

  const startedAt = Date.now()
  // Throws if the tree it built hashes to a root the pool never had, so a snapshot only reaches
  // disk once the chain has agreed with it.
  await protocol.sync()

  const state = protocol.dumpState()

  // Checked before anything is written, so a snapshot with a hole in it never reaches disk.
  await assertSnapshotIsComplete(state, callUrl)

  const json = JSON.stringify(state, (_key, value) =>
    typeof value === 'bigint' ? `0x${value.toString(16)}` : value
  )

  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(outPath, json)

  const synced = Object.values(state)[0]?.sync?.lastSyncedBlock
  console.log(
    `chain ${chainId}: wrote ${(json.length / 1_000_000).toFixed(2)} MB to ${outPath} ` +
      `(synced to ${BigInt(synced ?? 0)}, ${((Date.now() - startedAt) / 1000).toFixed(1)}s)`
  )
}

const main = async () => {
  if (!API_KEY) {
    console.error('REACT_APP_HYPERSYNC_API_KEY is not set - see .env-sample')
    process.exit(1)
  }

  const requested = process.argv.slice(2)
  const chainIds = requested.length ? requested.map(Number) : Object.keys(PrivacyPoolsV1_0xBow).map(Number)

  for (const chainId of chainIds) {
    // Sequential on purpose: two chains at once would share the same rate limit and make a refusal
    // look like a chain problem.
     
    await buildChainSnapshot(chainId)
  }
}

await main()
