import { toQuantity } from 'ethers'

type SupportedRpcMethod =
  | 'eth_blockNumber'
  | 'eth_getBlockByNumber'
  | 'eth_getLogs'
  | 'eth_getTransactionCount'
  | 'eth_call'

const ALCHEMY_API_KEY = process.env.REACT_APP_ALCHEMY_API_KEY || ''
const ALCHEMY_RPC_PREFIX_BY_CHAIN_ID: Record<string, string> = {
  '1': 'https://eth-mainnet.g.alchemy.com/v2/',
  '10': 'https://opt-mainnet.g.alchemy.com/v2/',
  '324': 'https://zksync-mainnet.g.alchemy.com/v2/',
  '480': 'https://worldchain-mainnet.g.alchemy.com/v2/',
  '8453': 'https://base-mainnet.g.alchemy.com/v2/',
  '42161': 'https://arb-mainnet.g.alchemy.com/v2/'
  // Temporarily disabled for approvals scanning until we bring back
  // the chunked/non-unlimited-chain path:
  // '56': 'https://bnb-mainnet.g.alchemy.com/v2/',
  // '137': 'https://polygon-mainnet.g.alchemy.com/v2/',
  // '143': 'https://monad-mainnet.g.alchemy.com/v2/',
  // '5000': 'https://mantle-mainnet.g.alchemy.com/v2/',
  // '43114': 'https://avax-mainnet.g.alchemy.com/v2/',
  // '534352': 'https://scroll-mainnet.g.alchemy.com/v2/',
  // '10143': 'https://monad-testnet.g.alchemy.com/v2/',
  // '11155111': 'https://eth-sepolia.g.alchemy.com/v2/',
  // '84532': 'https://base-sepolia.g.alchemy.com/v2/',
  // '421614': 'https://arb-sepolia.g.alchemy.com/v2/'
}

const METHOD_COSTS: Record<SupportedRpcMethod, number> = {
  eth_blockNumber: 10,
  eth_getBlockByNumber: 16,
  eth_getLogs: 60,
  eth_getTransactionCount: 20,
  eth_call: 26
}

const TOKEN_BUCKET_WINDOW_MS = 10_000
// Keep headroom below the example 5,000 CU / 10s bucket to avoid riding the exact limit.
const TOKEN_BUCKET_CAPACITY = 4_000
const TOKEN_BUCKET_REFILL_PER_MS = TOKEN_BUCKET_CAPACITY / TOKEN_BUCKET_WINDOW_MS
const MAX_CONCURRENT_REQUESTS = 2
const MAX_RETRIES = 6
const MAX_BACKOFF_MS = 64_000

type QueueTask = {
  cost: number
  execute: () => Promise<unknown>
  resolve: (value: unknown) => void
  reject: (reason?: unknown) => void
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const getAlchemyRpcUrl = (chainId: bigint) => {
  if (!ALCHEMY_API_KEY) {
    throw new Error('Approvals scanning requires REACT_APP_ALCHEMY_API_KEY to be configured.')
  }

  const chainIdKey = chainId.toString()
  const rpcPrefix = ALCHEMY_RPC_PREFIX_BY_CHAIN_ID[chainIdKey]

  if (!rpcPrefix) {
    throw new Error(`Alchemy RPC is not configured for chain ${chainIdKey}.`)
  }

  return `${rpcPrefix}${ALCHEMY_API_KEY}`
}

class AlchemyRateLimiter {
  private availableTokens = TOKEN_BUCKET_CAPACITY

  private lastRefillAt = Date.now()

  private activeRequests = 0

  private queue: QueueTask[] = []

  private timer: ReturnType<typeof setTimeout> | null = null

  private refillTokens() {
    const now = Date.now()
    const elapsed = now - this.lastRefillAt

    if (elapsed <= 0) return

    this.availableTokens = Math.min(
      TOKEN_BUCKET_CAPACITY,
      this.availableTokens + elapsed * TOKEN_BUCKET_REFILL_PER_MS
    )
    this.lastRefillAt = now
  }

  private scheduleNextDrain(delayMs: number) {
    if (this.timer) return

    this.timer = setTimeout(() => {
      this.timer = null
      this.drainQueue()
    }, Math.max(1, Math.ceil(delayMs)))
  }

  private drainQueue() {
    this.refillTokens()

    while (this.queue.length && this.activeRequests < MAX_CONCURRENT_REQUESTS) {
      const nextTask = this.queue[0]!

      if (this.availableTokens < nextTask.cost) {
        this.scheduleNextDrain((nextTask.cost - this.availableTokens) / TOKEN_BUCKET_REFILL_PER_MS)
        return
      }

      this.queue.shift()
      this.availableTokens -= nextTask.cost
      this.activeRequests += 1

      nextTask
        .execute()
        .then(nextTask.resolve, nextTask.reject)
        .finally(() => {
          this.activeRequests -= 1
          this.drainQueue()
        })
    }
  }

  run<T>(cost: number, execute: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        cost,
        execute,
        resolve,
        reject
      })
      this.drainQueue()
    })
  }
}

const rateLimiter = new AlchemyRateLimiter()

const parseRetryAfterMs = (retryAfterHeader: string | null) => {
  if (!retryAfterHeader) return null

  const asSeconds = Number(retryAfterHeader)
  if (Number.isFinite(asSeconds) && asSeconds >= 0) return asSeconds * 1000

  const asDate = Date.parse(retryAfterHeader)
  if (Number.isNaN(asDate)) return null

  return Math.max(asDate - Date.now(), 0)
}

const isRateLimitMessage = (message: string) => {
  const normalizedMessage = message.toLowerCase()

  return (
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('too many requests') ||
    normalizedMessage.includes('compute units') ||
    normalizedMessage.includes('429')
  )
}

const getBackoffDelayMs = (attempt: number, retryAfterHeader: string | null) => {
  const jitterMs = Math.floor(Math.random() * 1000)
  const exponentialBackoffMs = Math.min((2 ** attempt) * 1000 + jitterMs, MAX_BACKOFF_MS)
  const retryAfterMs = parseRetryAfterMs(retryAfterHeader)

  return retryAfterMs === null ? exponentialBackoffMs : Math.max(retryAfterMs, exponentialBackoffMs)
}

const normalizeGetLogsFilter = (filter: Record<string, any>) => ({
  ...filter,
  fromBlock: typeof filter.fromBlock === 'number' ? toQuantity(filter.fromBlock) : filter.fromBlock,
  toBlock: typeof filter.toBlock === 'number' ? toQuantity(filter.toBlock) : filter.toBlock
})

const normalizeHexToNumber = (value: string | undefined) =>
  value !== undefined ? Number(value) : undefined

const requestAlchemyRpc = async <T,>({
  chainId,
  method,
  params
}: {
  chainId: bigint
  method: SupportedRpcMethod
  params: any[]
}) => {
  const cost = METHOD_COSTS[method]

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const response = await rateLimiter.run(cost, async () =>
        fetch(getAlchemyRpcUrl(chainId), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: `${chainId.toString()}:${method}:${Date.now()}`,
            method,
            params
          })
        })
      )

      if (response.status === 429) {
        if (attempt === MAX_RETRIES) {
          throw new Error('Alchemy RPC rate limit exceeded.')
        }

        await sleep(getBackoffDelayMs(attempt, response.headers.get('Retry-After')))
        continue
      }

      if (!response.ok) {
        throw new Error(`Alchemy RPC request failed with status ${response.status}`)
      }

      const payload = await response.json()

      if (payload?.error?.code === 429 || isRateLimitMessage(payload?.error?.message || '')) {
        if (attempt === MAX_RETRIES) {
          throw new Error(payload.error.message || 'Alchemy RPC rate limit exceeded.')
        }

        await sleep(getBackoffDelayMs(attempt, response.headers.get('Retry-After')))
        continue
      }

      if (payload.error) {
        throw new Error(payload.error.message || `Alchemy RPC error for ${method}`)
      }

      return payload.result as T
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const isRateLimitError = isRateLimitMessage(message)

      if (!isRateLimitError || attempt === MAX_RETRIES) throw error

      await sleep(getBackoffDelayMs(attempt, null))
    }
  }

  throw new Error(`Alchemy RPC request failed for ${method}`)
}

export const alchemyRpc = {
  getBlockNumber: async (chainId: bigint) =>
    Number(await requestAlchemyRpc<string>({ chainId, method: 'eth_blockNumber', params: [] })),
  getBlock: async (chainId: bigint, blockNumber: number) => {
    const block = await requestAlchemyRpc<{ timestamp: string }>({
      chainId,
      method: 'eth_getBlockByNumber',
      params: [toQuantity(blockNumber), false]
    })

    return {
      timestamp: Number(block.timestamp)
    }
  },
  getLogs: async (chainId: bigint, filter: Record<string, any>) =>
    (
      await requestAlchemyRpc<any[]>({
        chainId,
        method: 'eth_getLogs',
        params: [normalizeGetLogsFilter(filter)]
      })
    ).map((log) => ({
      ...log,
      blockNumber: normalizeHexToNumber(log.blockNumber) ?? 0,
      transactionIndex: normalizeHexToNumber(log.transactionIndex),
      logIndex: normalizeHexToNumber(log.logIndex)
    })),
  getTransactionCount: async (chainId: bigint, address: string) =>
    Number(
      await requestAlchemyRpc<string>({
        chainId,
        method: 'eth_getTransactionCount',
        params: [address, 'latest']
      })
    ),
  call: (chainId: bigint, params: Record<string, any>) =>
    requestAlchemyRpc<string>({
      chainId,
      method: 'eth_call',
      params: [params, 'latest']
    })
}
