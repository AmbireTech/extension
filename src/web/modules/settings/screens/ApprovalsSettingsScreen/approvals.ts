import { getAddress, Interface, MaxUint256, ZeroAddress, id, zeroPadValue } from 'ethers'

import { Network } from '@ambire-common/interfaces/network'
import { Call } from '@ambire-common/libs/accountOp/types'

const ERC20_INTERFACE = new Interface([
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'function decreaseAllowance(address spender, uint256 subtractedValue) returns (bool)',
  'event Approval(address indexed owner, address indexed spender, uint256 amount)'
])

const ERC721_INTERFACE = new Interface([
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function isApprovedForAll(address owner, address operator) view returns (bool)',
  'function approve(address to, uint256 tokenId)',
  'function setApprovalForAll(address operator, bool approved)',
  'event Approval(address indexed owner, address indexed spender, uint256 indexed tokenId)',
  'event ApprovalForAll(address indexed owner, address indexed spender, bool approved)'
])

const PERMIT2_INTERFACE = new Interface([
  'function allowance(address owner, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)',
  'function approve(address token, address spender, uint160 amount, uint48 expiration)',
  'event Approval(address indexed owner, address indexed token, address indexed spender, uint160 amount, uint48 expiration)',
  'event Permit(address indexed owner, address indexed token, address indexed spender, uint160 amount, uint48 expiration, uint48 nonce)',
  'event Lockdown(address indexed owner, address indexed token, address indexed spender)'
])

const APPROVAL_TOPIC = id('Approval(address,address,uint256)')
const APPROVAL_FOR_ALL_TOPIC = id('ApprovalForAll(address,address,bool)')
const PERMIT2_APPROVAL_TOPIC = id(
  'Approval(address,address,address,uint160,uint48)'
).toLowerCase()
const PERMIT2_PERMIT_TOPIC = id('Permit(address,address,address,uint160,uint48,uint48)').toLowerCase()
const PERMIT2_LOCKDOWN_TOPIC = id('Lockdown(address,address,address)').toLowerCase()
const PERMIT2_ADDRESS = getAddress('0x000000000022D473030F116dDEE9F6B43aC78BA3')
const MAX_UINT160 = (1n << 160n) - 1n
const DEFAULT_LOG_CHUNK = 10_000
const LOG_CHUNK_BY_CHAIN_ID: Record<string, number> = {
  '137': 2_000,
  '143': 1_000,
  '10143': 1_000
}
export const APPROVAL_SCAN_SUPPORTED_CHAIN_IDS = new Set(['1', '10', '324', '480', '8453', '42161'])
const NETWORK_SCAN_CONCURRENCY = 4
const APPROVAL_VERIFY_CONCURRENCY = 3
const APPROVAL_LOOKBACK_WINDOW_MS = 5 * 365 * 24 * 60 * 60 * 1000
const APPROVAL_LOOKBACK_CACHE_BUCKET_MS = 60 * 60 * 1000
const LOG_CHUNK_HINTS_BY_RPC = new Map<string, number>()
const LOOKBACK_START_BLOCKS_BY_RPC = new Map<string, number>()
const NETWORK_SCAN_STATES = new Map<string, NetworkScanState>()

const getTargetLogChunkSize = (chainId: bigint) =>
  LOG_CHUNK_BY_CHAIN_ID[chainId.toString()] || DEFAULT_LOG_CHUNK

export const isApprovalScanningSupported = (chainId: bigint) =>
  APPROVAL_SCAN_SUPPORTED_CHAIN_IDS.has(chainId.toString())

const supportsUnlimitedLogRange = (chainId: bigint) => isApprovalScanningSupported(chainId)

type ScanPhase = 'approval' | 'approvalForAll' | 'permit2'
const SCAN_PHASES: ScanPhase[] = ['approval', 'approvalForAll', 'permit2']

type NetworkScanSubscriber = {
  onApprovalsDiscovered?: (approvals: ApprovalItem[]) => void
}

type NetworkScanState = {
  accountAddr: string
  chainId: bigint
  latestBlock: number
  startBlock: number
  targetLogChunkSize: number
  logChunkSizeHint: number
  approvalsById: Map<string, ApprovalItem>
  nextFromBlockByPhase: Record<ScanPhase, number>
  completedPhases: Set<ScanPhase>
  isCompleted: boolean
  inFlightPromise?: Promise<ApprovalItem[]>
  subscribers: Set<NetworkScanSubscriber>
}

type SerializedApprovalItem = Omit<ApprovalItem, 'chainId' | 'amount' | 'tokenId'> & {
  chainId: string
  amount?: string
  tokenId?: string
}

type PersistedNetworkScanState = {
  accountAddr: string
  chainId: string
  latestBlock: number
  startBlock: number
  targetLogChunkSize: number
  logChunkSizeHint: number
  approvals: SerializedApprovalItem[]
  nextFromBlockByPhase: Record<ScanPhase, number>
  completedPhases: ScanPhase[]
  isCompleted: boolean
  updatedAt: number
}

const APPROVAL_SCAN_STORAGE_PREFIX = 'ambire:approvals-scan-state:v2:'
const APPROVAL_SCAN_STATE_TTL_MS = 30 * 60 * 1000

export type ApprovalKind = 'erc20' | 'erc721-single' | 'erc721-all' | 'permit2'

export type ApprovalItem = {
  id: string
  chainId: bigint
  tokenAddress: string
  spender: string
  kind: ApprovalKind
  amount?: bigint
  tokenId?: bigint
  expiration?: number
  permit2Address?: string
  updatedAtBlock: number
  updatedAtTxHash?: string
  transactionIndex: number
  logIndex: number
}

export type ApprovalScanFailure = {
  chainId: bigint
  message: string
}

export type ProviderCaller = <T = any>(params: {
  chainId: bigint
  method: 'getBlockNumber' | 'getBlock' | 'getLogs' | 'getTransactionCount' | 'call'
  args: any[]
}) => Promise<T>

type RawLog = {
  address: string
  data: string
  topics: string[]
  blockNumber: number
  transactionHash?: string
  transactionIndex?: number
  logIndex?: number
  index?: number
}

type ApprovalCandidate = ApprovalItem & {
  eventAmount?: bigint
  eventApproved?: boolean
}

type RawBlock = {
  timestamp: number
}

const normalizeAddress = (address: string) => getAddress(address)

const lowerAddress = (address: string) => normalizeAddress(address).toLowerCase()

const getApprovalKey = (approval: Pick<ApprovalItem, 'chainId' | 'tokenAddress' | 'spender' | 'kind'> & {
  tokenId?: bigint
  permit2Address?: string
}) => {
  switch (approval.kind) {
    case 'erc721-single':
      return [
        approval.chainId.toString(),
        lowerAddress(approval.tokenAddress),
        approval.tokenId?.toString() || '0',
        approval.kind
      ].join(':')
    case 'permit2':
      return [
        approval.chainId.toString(),
        lowerAddress(approval.tokenAddress),
        lowerAddress(approval.spender),
        lowerAddress(approval.permit2Address || PERMIT2_ADDRESS),
        approval.kind
      ].join(':')
    default:
      return [
        approval.chainId.toString(),
        lowerAddress(approval.tokenAddress),
        lowerAddress(approval.spender),
        approval.kind
      ].join(':')
  }
}

const normalizeErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message

  return 'Unknown error'
}

const extractLogRangeLimit = (error: unknown) => {
  const message = normalizeErrorMessage(error)
  const directLimitMatch = message.match(/limited to (\d+) block range/i)

  if (directLimitMatch) return Number(directLimitMatch[1])

  const genericLimitMatch = message.match(/(\d+)\s*(?:blocks?|block range)/i)

  if (genericLimitMatch) return Number(genericLimitMatch[1])

  return null
}

const sortLogsNewestFirst = (a: RawLog, b: RawLog) => {
  if (a.blockNumber !== b.blockNumber) return b.blockNumber - a.blockNumber

  const aTransactionIndex = a.transactionIndex || 0
  const bTransactionIndex = b.transactionIndex || 0
  if (aTransactionIndex !== bTransactionIndex) return bTransactionIndex - aTransactionIndex

  const aLogIndex = a.logIndex ?? a.index ?? 0
  const bLogIndex = b.logIndex ?? b.index ?? 0

  return bLogIndex - aLogIndex
}

const sortApprovals = (approvals: ApprovalItem[], networks: Network[]) => {
  const networkOrder = new Map(networks.map((network, index) => [network.chainId.toString(), index]))

  return [...approvals].sort((a, b) => {
    const aNetworkIndex = networkOrder.get(a.chainId.toString()) ?? Number.MAX_SAFE_INTEGER
    const bNetworkIndex = networkOrder.get(b.chainId.toString()) ?? Number.MAX_SAFE_INTEGER

    if (aNetworkIndex !== bNetworkIndex) return aNetworkIndex - bNetworkIndex
    if (a.updatedAtBlock !== b.updatedAtBlock) return b.updatedAtBlock - a.updatedAtBlock
    if (a.transactionIndex !== b.transactionIndex) return b.transactionIndex - a.transactionIndex

    return b.logIndex - a.logIndex
  })
}

const runWithConcurrency = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
) => {
  const results = new Array<R>(items.length)
  let nextIndex = 0

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (true) {
        const currentIndex = nextIndex
        nextIndex += 1

        if (currentIndex >= items.length) return

        results[currentIndex] = await worker(items[currentIndex]!)
      }
    })
  )

  return results
}

const callRaw = async ({
  chainId,
  address,
  data,
  callProvider,
  from
}: {
  chainId: bigint
  address: string
  data: string
  callProvider: ProviderCaller
  from?: string
}) => {
  return callProvider<string>({
    chainId,
    method: 'call',
    args: [{ to: address, data, ...(from ? { from } : {}) }]
  })
}

const readContract = async <T>({
  chainId,
  address,
  iface,
  method,
  args,
  callProvider
}: {
  chainId: bigint
  address: string
  iface: Interface
  method: string
  args: any[]
  callProvider: ProviderCaller
}) => {
  const result = await callRaw({
    chainId,
    address,
    data: iface.encodeFunctionData(method, args),
    callProvider
  })
  const decoded = iface.decodeFunctionResult(method, result)

  return (decoded.length === 1 ? decoded[0] : decoded) as T
}

const getNetworkScanStateKey = ({
  accountAddr,
  chainId
}: {
  accountAddr: string
  chainId: bigint
}) => `${lowerAddress(accountAddr)}:${chainId.toString()}`

const getPersistedNetworkScanStorageKey = (cacheKey: string) =>
  `${APPROVAL_SCAN_STORAGE_PREFIX}${cacheKey}`

const hasStorage = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const serializeApprovalItem = (approval: ApprovalItem): SerializedApprovalItem => ({
  ...approval,
  chainId: approval.chainId.toString(),
  amount: approval.amount?.toString(),
  tokenId: approval.tokenId?.toString()
})

const deserializeApprovalItem = (approval: SerializedApprovalItem): ApprovalItem => ({
  ...approval,
  chainId: BigInt(approval.chainId),
  amount: approval.amount !== undefined ? BigInt(approval.amount) : undefined,
  tokenId: approval.tokenId !== undefined ? BigInt(approval.tokenId) : undefined
})

const persistNetworkScanState = ({ cacheKey, state }: { cacheKey: string; state: NetworkScanState }) => {
  if (!hasStorage()) return

  const serializedState: PersistedNetworkScanState = {
    accountAddr: state.accountAddr,
    chainId: state.chainId.toString(),
    latestBlock: state.latestBlock,
    startBlock: state.startBlock,
    targetLogChunkSize: state.targetLogChunkSize,
    logChunkSizeHint: state.logChunkSizeHint,
    approvals: Array.from(state.approvalsById.values()).map(serializeApprovalItem),
    nextFromBlockByPhase: state.nextFromBlockByPhase,
    completedPhases: Array.from(state.completedPhases),
    isCompleted: state.isCompleted,
    updatedAt: Date.now()
  }

  try {
    window.localStorage.setItem(
      getPersistedNetworkScanStorageKey(cacheKey),
      JSON.stringify(serializedState)
    )
  } catch (error) {
    // Ignore persistence issues and keep the in-memory scan running.
  }
}

const clearPersistedNetworkScanState = (cacheKey: string) => {
  if (!hasStorage()) return

  try {
    window.localStorage.removeItem(getPersistedNetworkScanStorageKey(cacheKey))
  } catch (error) {
    // Ignore persistence issues.
  }
}

const loadPersistedNetworkScanState = ({
  cacheKey,
  accountAddr,
  network,
  startBlock,
  latestBlock,
  targetLogChunkSize
}: {
  cacheKey: string
  accountAddr: string
  network: Network
  startBlock: number
  latestBlock: number
  targetLogChunkSize: number
}) => {
  if (!hasStorage()) return null

  try {
    const rawState = window.localStorage.getItem(getPersistedNetworkScanStorageKey(cacheKey))

    if (!rawState) return null

    const parsedState = JSON.parse(rawState) as PersistedNetworkScanState

    if (Date.now() - parsedState.updatedAt > APPROVAL_SCAN_STATE_TTL_MS) {
      clearPersistedNetworkScanState(cacheKey)

      return null
    }

    if (
      parsedState.accountAddr !== normalizeAddress(accountAddr) ||
      parsedState.chainId !== network.chainId.toString()
    ) {
      clearPersistedNetworkScanState(cacheKey)

      return null
    }

    const restoredState: NetworkScanState = {
      accountAddr: parsedState.accountAddr,
      chainId: network.chainId,
      latestBlock: parsedState.latestBlock,
      startBlock: parsedState.startBlock,
      targetLogChunkSize: parsedState.targetLogChunkSize,
      logChunkSizeHint: Math.max(parsedState.logChunkSizeHint, targetLogChunkSize),
      approvalsById: new Map(
        parsedState.approvals.map((approval) => {
          const deserializedApproval = deserializeApprovalItem(approval)

          return [deserializedApproval.id, deserializedApproval] as const
        })
      ),
      nextFromBlockByPhase: parsedState.nextFromBlockByPhase,
      completedPhases: new Set(parsedState.completedPhases),
      isCompleted: parsedState.isCompleted,
      subscribers: new Set<NetworkScanSubscriber>()
    }

    return restoredState
  } catch (error) {
    clearPersistedNetworkScanState(cacheKey)

    return null
  }
}

export const getCachedApprovalsForAccount = ({
  accountAddr,
  networks
}: {
  accountAddr: string
  networks: Network[]
}) => {
  const normalizedAccountAddr = normalizeAddress(accountAddr)
  const approvalsById = new Map<string, ApprovalItem>()

  networks.forEach((network) => {
    const cacheKey = getNetworkScanStateKey({
      accountAddr: normalizedAccountAddr,
      chainId: network.chainId
    })
    const inMemoryState = NETWORK_SCAN_STATES.get(cacheKey)

    if (inMemoryState && inMemoryState.accountAddr === normalizedAccountAddr) {
      inMemoryState.approvalsById.forEach((approval, approvalId) => {
        approvalsById.set(approvalId, approval)
      })

      return
    }

    if (!hasStorage()) return

    try {
      const rawState = window.localStorage.getItem(getPersistedNetworkScanStorageKey(cacheKey))

      if (!rawState) return

      const parsedState = JSON.parse(rawState) as PersistedNetworkScanState

      if (Date.now() - parsedState.updatedAt > APPROVAL_SCAN_STATE_TTL_MS) {
        clearPersistedNetworkScanState(cacheKey)
        return
      }

      if (
        parsedState.accountAddr !== normalizedAccountAddr ||
        parsedState.chainId !== network.chainId.toString()
      ) {
        clearPersistedNetworkScanState(cacheKey)
        return
      }

      parsedState.approvals.forEach((approval) => {
        const deserializedApproval = deserializeApprovalItem(approval)

        approvalsById.set(deserializedApproval.id, deserializedApproval)
      })
    } catch (error) {
      clearPersistedNetworkScanState(cacheKey)
    }
  })

  return sortApprovals(Array.from(approvalsById.values()), networks)
}

const sortApprovalsForNetwork = (approvals: ApprovalItem[], network: Network) =>
  sortApprovals(approvals, [network])

const notifyApprovalsDiscovered = ({
  state,
  approvals,
  network
}: {
  state: NetworkScanState
  approvals: ApprovalItem[]
  network: Network
}) => {
  if (!approvals.length) return

  const sortedApprovals = sortApprovalsForNetwork(approvals, network)

  state.subscribers.forEach((subscriber) => {
    subscriber.onApprovalsDiscovered?.(sortedApprovals)
  })
}

const notifyCurrentApprovals = ({
  state,
  network,
  subscriber
}: {
  state: NetworkScanState
  network: Network
  subscriber?: NetworkScanSubscriber
}) => {
  if (!subscriber?.onApprovalsDiscovered) return

  const currentApprovals = Array.from(state.approvalsById.values())

  if (!currentApprovals.length) return

  subscriber.onApprovalsDiscovered(sortApprovalsForNetwork(currentApprovals, network))
}

const getOrCreateNetworkScanState = ({
  accountAddr,
  network,
  startBlock,
  latestBlock,
  targetLogChunkSize
}: {
  accountAddr: string
  network: Network
  startBlock: number
  latestBlock: number
  targetLogChunkSize: number
}) => {
  const cacheKey = getNetworkScanStateKey({ accountAddr, chainId: network.chainId })
  const existingState = NETWORK_SCAN_STATES.get(cacheKey)

  if (existingState && existingState.accountAddr === normalizeAddress(accountAddr)) {
    existingState.startBlock = Math.min(existingState.startBlock, startBlock)
    existingState.targetLogChunkSize = targetLogChunkSize
    existingState.logChunkSizeHint = Math.max(existingState.logChunkSizeHint, targetLogChunkSize)

    if (latestBlock > existingState.latestBlock) {
      const previousLatestBlock = existingState.latestBlock

      existingState.latestBlock = latestBlock

      let reopenedPhase = false

      SCAN_PHASES.forEach((phase) => {
        if (!existingState.completedPhases.has(phase)) return

        existingState.nextFromBlockByPhase[phase] = previousLatestBlock + 1
        existingState.completedPhases.delete(phase)
        reopenedPhase = true
      })

      if (reopenedPhase) existingState.isCompleted = false
    }

    persistNetworkScanState({ cacheKey, state: existingState })

    return existingState
  }

  const persistedState = loadPersistedNetworkScanState({
    cacheKey,
    accountAddr,
    network,
    startBlock,
    latestBlock,
    targetLogChunkSize
  })

  if (persistedState) {
    persistedState.startBlock = Math.min(persistedState.startBlock, startBlock)
    persistedState.targetLogChunkSize = targetLogChunkSize
    persistedState.logChunkSizeHint = Math.max(persistedState.logChunkSizeHint, targetLogChunkSize)

    if (latestBlock > persistedState.latestBlock) {
      const previousLatestBlock = persistedState.latestBlock

      persistedState.latestBlock = latestBlock

      let reopenedPhase = false

      SCAN_PHASES.forEach((phase) => {
        if (!persistedState.completedPhases.has(phase)) return

        persistedState.nextFromBlockByPhase[phase] = previousLatestBlock + 1
        persistedState.completedPhases.delete(phase)
        reopenedPhase = true
      })

      if (reopenedPhase) persistedState.isCompleted = false
    }

    NETWORK_SCAN_STATES.set(cacheKey, persistedState)
    persistNetworkScanState({ cacheKey, state: persistedState })

    return persistedState
  }

  const nextState: NetworkScanState = {
    accountAddr: normalizeAddress(accountAddr),
    chainId: network.chainId,
    latestBlock,
    startBlock,
    targetLogChunkSize,
    logChunkSizeHint: Math.max(
      LOG_CHUNK_HINTS_BY_RPC.get(`${network.chainId.toString()}:alchemy`) || targetLogChunkSize,
      targetLogChunkSize
    ),
    approvalsById: new Map<string, ApprovalItem>(),
    nextFromBlockByPhase: {
      approval: startBlock,
      approvalForAll: startBlock,
      permit2: startBlock
    },
    completedPhases: new Set<ScanPhase>(),
    isCompleted: false,
    subscribers: new Set<NetworkScanSubscriber>()
  }

  NETWORK_SCAN_STATES.set(cacheKey, nextState)
  persistNetworkScanState({ cacheKey, state: nextState })

  return nextState
}

const scanBlockChunks = async ({
  fromBlock,
  latestBlock,
  initialFromBlock = fromBlock,
  initialChunkSize = DEFAULT_LOG_CHUNK,
  minChunkSize = DEFAULT_LOG_CHUNK,
  onChunkSizeDiscovered,
  onChunkProcessed,
  executeChunk
}: {
  fromBlock: number
  latestBlock: number
  initialFromBlock?: number
  initialChunkSize?: number
  minChunkSize?: number
  onChunkSizeDiscovered?: (chunkSize: number) => void
  onChunkProcessed?: (nextFromBlock: number) => void
  executeChunk: (chunk: { fromBlock: number; toBlock: number }) => Promise<void>
}) => {
  let currentFromBlock = Math.max(initialFromBlock, fromBlock)

  if (currentFromBlock > latestBlock) return

  const effectiveMinChunkSize = Math.max(
    1,
    Math.min(minChunkSize, latestBlock - fromBlock + 1, initialChunkSize)
  )
  let maxChunkSize = Math.max(
    Math.min(initialChunkSize, latestBlock - fromBlock + 1),
    effectiveMinChunkSize
  )
  let currentChunkSize = maxChunkSize

  while (currentFromBlock <= latestBlock) {
    const currentToBlock = Math.min(latestBlock, currentFromBlock + currentChunkSize - 1)

    try {
      await executeChunk({ fromBlock: currentFromBlock, toBlock: currentToBlock })
      onChunkSizeDiscovered?.(currentChunkSize)
      currentFromBlock = currentToBlock + 1
      onChunkProcessed?.(currentFromBlock)
      currentChunkSize = Math.max(
        Math.min(maxChunkSize, latestBlock - currentFromBlock + 1),
        effectiveMinChunkSize
      )
    } catch (error) {
      const discoveredLimit = extractLogRangeLimit(error)

      if (discoveredLimit && discoveredLimit > 0 && discoveredLimit < currentChunkSize) {
        maxChunkSize = Math.max(discoveredLimit, effectiveMinChunkSize)
        currentChunkSize = maxChunkSize
        onChunkSizeDiscovered?.(currentChunkSize)
        continue
      }

      if (currentChunkSize <= effectiveMinChunkSize) {
        throw error
      }

      currentChunkSize = Math.max(Math.floor(currentChunkSize / 2), effectiveMinChunkSize)
      maxChunkSize = Math.min(maxChunkSize, currentChunkSize)
      onChunkSizeDiscovered?.(currentChunkSize)
    }
  }
}

const getLookbackCacheKey = ({ chainId, targetTimestampMs }: { chainId: bigint; targetTimestampMs: number }) =>
  `${chainId.toString()}:alchemy:${Math.floor(targetTimestampMs / APPROVAL_LOOKBACK_CACHE_BUCKET_MS)}`

const findBlockAtOrAfterTimestamp = async ({
  chainId,
  latestBlock,
  targetTimestampMs,
  callProvider
}: {
  chainId: bigint
  latestBlock: number
  targetTimestampMs: number
  callProvider: ProviderCaller
}) => {
  const cacheKey = getLookbackCacheKey({ chainId, targetTimestampMs })

  if (LOOKBACK_START_BLOCKS_BY_RPC.has(cacheKey)) {
    return LOOKBACK_START_BLOCKS_BY_RPC.get(cacheKey)!
  }

  let low = 0
  let high = latestBlock

  while (low < high) {
    const mid = Math.floor((low + high) / 2)
    const block = await callProvider<RawBlock>({
      chainId,
      method: 'getBlock',
      args: [mid]
    })

    if (block.timestamp * 1000 >= targetTimestampMs) {
      high = mid
    } else {
      low = mid + 1
    }
  }

  LOOKBACK_START_BLOCKS_BY_RPC.set(cacheKey, low)

  return low
}

const parseApprovalLog = (log: RawLog, chainId: bigint): ApprovalCandidate | null => {
  try {
    const transactionIndex = log.transactionIndex || 0
    const logIndex = log.logIndex ?? log.index ?? 0

    if (log.topics.length >= 4) {
      const parsed = ERC721_INTERFACE.parseLog({ topics: log.topics, data: log.data })

      if (!parsed) return null

      return {
        id: '',
        chainId,
        tokenAddress: normalizeAddress(log.address),
        spender: normalizeAddress(parsed.args.spender),
        kind: 'erc721-single',
        tokenId: BigInt(parsed.args.tokenId),
        updatedAtBlock: log.blockNumber,
        updatedAtTxHash: log.transactionHash,
        transactionIndex,
        logIndex
      }
    }

    const parsed = ERC20_INTERFACE.parseLog({
      topics: log.topics,
      data: log.data
    })

    if (!parsed) return null

    return {
      id: '',
      chainId,
      tokenAddress: normalizeAddress(log.address),
      spender: normalizeAddress(parsed.args.spender),
      kind: 'erc20',
      eventAmount: BigInt(parsed.args.amount),
      updatedAtBlock: log.blockNumber,
      updatedAtTxHash: log.transactionHash,
      transactionIndex,
      logIndex
    }
  } catch (error) {
    return null
  }
}

const parseApprovalForAllLog = (log: RawLog, chainId: bigint): ApprovalCandidate | null => {
  try {
    const parsed = ERC721_INTERFACE.parseLog({ topics: log.topics, data: log.data })

    if (!parsed) return null

    return {
      id: '',
      chainId,
      tokenAddress: normalizeAddress(log.address),
      spender: normalizeAddress(parsed.args.spender),
      kind: 'erc721-all',
      eventApproved: Boolean(parsed.args.approved),
      updatedAtBlock: log.blockNumber,
      updatedAtTxHash: log.transactionHash,
      transactionIndex: log.transactionIndex || 0,
      logIndex: log.logIndex ?? log.index ?? 0
    }
  } catch (error) {
    return null
  }
}

const parsePermit2Log = (log: RawLog, chainId: bigint): ApprovalCandidate | null => {
  try {
    const parsed = PERMIT2_INTERFACE.parseLog({ topics: log.topics, data: log.data })

    if (!parsed) return null

    const amount = parsed.name === 'Lockdown' ? 0n : BigInt(parsed.args.amount)
    const expiration = parsed.name === 'Lockdown' ? 0 : Number(parsed.args.expiration)

    return {
      id: '',
      chainId,
      tokenAddress: normalizeAddress(parsed.args.token),
      spender: normalizeAddress(parsed.args.spender),
      kind: 'permit2',
      permit2Address: normalizeAddress(log.address),
      eventAmount: amount,
      expiration,
      updatedAtBlock: log.blockNumber,
      updatedAtTxHash: log.transactionHash,
      transactionIndex: log.transactionIndex || 0,
      logIndex: log.logIndex ?? log.index ?? 0
    }
  } catch (error) {
    return null
  }
}

const verifyApproval = async ({
  approval,
  accountAddr,
  callProvider
}: {
  approval: ApprovalCandidate
  accountAddr: string
  callProvider: ProviderCaller
}): Promise<ApprovalItem | null> => {
  try {
    switch (approval.kind) {
      case 'erc20': {
        if (!approval.eventAmount || approval.eventAmount === 0n) return null

        const allowance = await readContract<bigint>({
          chainId: approval.chainId,
          address: approval.tokenAddress,
          iface: ERC20_INTERFACE,
          method: 'allowance',
          args: [accountAddr, approval.spender],
          callProvider
        })

        if (allowance === 0n) return null

        return {
          ...approval,
          id: getApprovalKey(approval),
          amount: allowance
        }
      }
      case 'erc721-single': {
        if (!approval.tokenId || lowerAddress(approval.spender) === lowerAddress(ZeroAddress)) {
          return null
        }

        const [owner, approvedSpender] = await Promise.all([
          readContract<string>({
            chainId: approval.chainId,
            address: approval.tokenAddress,
            iface: ERC721_INTERFACE,
            method: 'ownerOf',
            args: [approval.tokenId],
            callProvider
          }),
          readContract<string>({
            chainId: approval.chainId,
            address: approval.tokenAddress,
            iface: ERC721_INTERFACE,
            method: 'getApproved',
            args: [approval.tokenId],
            callProvider
          })
        ])

        if (lowerAddress(owner) !== lowerAddress(accountAddr)) return null
        if (lowerAddress(approvedSpender) !== lowerAddress(approval.spender)) return null

        return {
          ...approval,
          id: getApprovalKey(approval)
        }
      }
      case 'erc721-all': {
        if (!approval.eventApproved) return null

        const isApprovedForAll = await readContract<boolean>({
          chainId: approval.chainId,
          address: approval.tokenAddress,
          iface: ERC721_INTERFACE,
          method: 'isApprovedForAll',
          args: [accountAddr, approval.spender],
          callProvider
        })

        if (!isApprovedForAll) return null

        return {
          ...approval,
          id: getApprovalKey(approval)
        }
      }
      case 'permit2': {
        if (!approval.eventAmount || approval.eventAmount === 0n) return null

        const permit2Address = approval.permit2Address || PERMIT2_ADDRESS
        const [amount, expiration] = (await readContract<[bigint, bigint, bigint]>({
          chainId: approval.chainId,
          address: permit2Address,
          iface: PERMIT2_INTERFACE,
          method: 'allowance',
          args: [accountAddr, approval.tokenAddress, approval.spender],
          callProvider
        })) as [bigint, bigint, bigint]

        if (amount === 0n || Number(expiration) * 1000 <= Date.now()) return null

        return {
          ...approval,
          id: getApprovalKey({ ...approval, permit2Address }),
          amount,
          expiration: Number(expiration),
          permit2Address
        }
      }
      default:
        return null
    }
  } catch (error) {
    return null
  }
}

const scanNetworkApprovals = async ({
  accountAddr,
  network,
  callProvider,
  onApprovalsDiscovered
}: {
  accountAddr: string
  network: Network
  callProvider: ProviderCaller
  onApprovalsDiscovered?: (approvals: ApprovalItem[]) => void
}) => {
  const scanStateKey = getNetworkScanStateKey({ accountAddr, chainId: network.chainId })
  const transactionCount = await callProvider<number>({
    chainId: network.chainId,
    method: 'getTransactionCount',
    args: [accountAddr]
  })

  if (Number(transactionCount) === 0) {
    NETWORK_SCAN_STATES.delete(scanStateKey)
    clearPersistedNetworkScanState(scanStateKey)

    return []
  }

  const latestBlock = Number(
    await callProvider<number>({
      chainId: network.chainId,
      method: 'getBlockNumber',
      args: []
    })
  )
  const latestBlockData = await callProvider<RawBlock>({
    chainId: network.chainId,
    method: 'getBlock',
    args: [latestBlock]
  })
  const ownerTopic = zeroPadValue(accountAddr, 32).toLowerCase()
  const lookbackTimestampMs = latestBlockData.timestamp * 1000 - APPROVAL_LOOKBACK_WINDOW_MS
  const startBlock =
    lookbackTimestampMs <= 0
      ? 0
      : await findBlockAtOrAfterTimestamp({
          chainId: network.chainId,
          latestBlock,
          targetTimestampMs: lookbackTimestampMs,
          callProvider
        })
  const rpcHintKey = `${network.chainId.toString()}:alchemy`
  const targetLogChunkSize = getTargetLogChunkSize(network.chainId)
  const state = getOrCreateNetworkScanState({
    accountAddr,
    network,
    startBlock,
    latestBlock,
    targetLogChunkSize
  })
  const subscriber: NetworkScanSubscriber | undefined = onApprovalsDiscovered
    ? { onApprovalsDiscovered }
    : undefined

  if (subscriber) {
    state.subscribers.add(subscriber)
    notifyCurrentApprovals({ state, network, subscriber })
  }

  try {
    if (state.isCompleted) {
      return sortApprovalsForNetwork(Array.from(state.approvalsById.values()), network)
    }

    const updateChunkHint = (chunkSize: number) => {
      state.logChunkSizeHint = Math.max(
        Math.min(state.logChunkSizeHint, chunkSize),
        state.targetLogChunkSize
      )
      LOG_CHUNK_HINTS_BY_RPC.set(rpcHintKey, state.logChunkSizeHint)
      persistNetworkScanState({ cacheKey: scanStateKey, state })
    }

    const applyLatestCandidates = async (candidates: ApprovalCandidate[]) => {
      if (!candidates.length) return

      const latestCandidatesByKey = new Map<string, ApprovalCandidate>()

      candidates
        .sort((a, b) => {
          if (a.updatedAtBlock !== b.updatedAtBlock) return b.updatedAtBlock - a.updatedAtBlock
          if (a.transactionIndex !== b.transactionIndex) return b.transactionIndex - a.transactionIndex

          return b.logIndex - a.logIndex
        })
        .forEach((candidate) => {
          const key = getApprovalKey(candidate)

          if (!latestCandidatesByKey.has(key)) latestCandidatesByKey.set(key, candidate)
        })

      const verificationResults = await runWithConcurrency(
        Array.from(latestCandidatesByKey.values()),
        APPROVAL_VERIFY_CONCURRENCY,
        async (candidate) =>
          ({
            candidate,
            verifiedApproval: await verifyApproval({
              approval: candidate,
              accountAddr,
              callProvider
            })
          }) as const
      )

      const changedApprovals: ApprovalItem[] = []

      verificationResults.forEach(({ candidate, verifiedApproval }) => {
        const key = getApprovalKey(candidate)

        if (verifiedApproval) {
          state.approvalsById.set(key, verifiedApproval)
          changedApprovals.push(verifiedApproval)
          return
        }

        state.approvalsById.delete(key)
      })

      persistNetworkScanState({ cacheKey: scanStateKey, state })
      notifyApprovalsDiscovered({ state, approvals: changedApprovals, network })
    }

    const scanTopicPhase = async ({
      phase,
      filter,
      parser
    }: {
      phase: Exclude<ScanPhase, 'permit2'>
      filter: { address?: string; topics: Array<string | null> }
      parser: (log: RawLog, chainId: bigint) => ApprovalCandidate | null
    }) => {
      if (state.completedPhases.has(phase)) return

      const phaseInitialFromBlock = state.nextFromBlockByPhase[phase]
      const phaseInitialChunkSize = supportsUnlimitedLogRange(network.chainId)
        ? Math.max(state.latestBlock - phaseInitialFromBlock + 1, state.targetLogChunkSize)
        : state.logChunkSizeHint

      await scanBlockChunks({
        fromBlock: state.startBlock,
        latestBlock: state.latestBlock,
        initialFromBlock: phaseInitialFromBlock,
        initialChunkSize: phaseInitialChunkSize,
        minChunkSize: state.targetLogChunkSize,
        onChunkSizeDiscovered: updateChunkHint,
        onChunkProcessed: (nextFromBlock) => {
          state.nextFromBlockByPhase[phase] = nextFromBlock
          persistNetworkScanState({ cacheKey: scanStateKey, state })
        },
        executeChunk: async ({ fromBlock: chunkFromBlock, toBlock: chunkToBlock }) => {
          const chunkLogs = await callProvider<RawLog[]>({
            chainId: network.chainId,
            method: 'getLogs',
            args: [{ ...filter, fromBlock: chunkFromBlock, toBlock: chunkToBlock }]
          })

          const candidates = chunkLogs
            .sort(sortLogsNewestFirst)
            .map((log) => parser(log, network.chainId))
            .filter(Boolean) as ApprovalCandidate[]

          await applyLatestCandidates(candidates)
        }
      })

      state.completedPhases.add(phase)
      state.nextFromBlockByPhase[phase] = state.latestBlock + 1
      persistNetworkScanState({ cacheKey: scanStateKey, state })
    }

    const scanPermit2Phase = async () => {
      if (state.completedPhases.has('permit2')) return

      const phaseInitialFromBlock = state.nextFromBlockByPhase.permit2
      const phaseInitialChunkSize = supportsUnlimitedLogRange(network.chainId)
        ? Math.max(state.latestBlock - phaseInitialFromBlock + 1, state.targetLogChunkSize)
        : state.logChunkSizeHint

      await scanBlockChunks({
        fromBlock: state.startBlock,
        latestBlock: state.latestBlock,
        initialFromBlock: phaseInitialFromBlock,
        initialChunkSize: phaseInitialChunkSize,
        minChunkSize: state.targetLogChunkSize,
        onChunkSizeDiscovered: updateChunkHint,
        onChunkProcessed: (nextFromBlock) => {
          state.nextFromBlockByPhase.permit2 = nextFromBlock
          persistNetworkScanState({ cacheKey: scanStateKey, state })
        },
        executeChunk: async ({ fromBlock: chunkFromBlock, toBlock: chunkToBlock }) => {
          const [permit2ApprovalLogs, permit2PermitLogs, permit2LockdownLogs] = await Promise.all([
            callProvider<RawLog[]>({
              chainId: network.chainId,
              method: 'getLogs',
              args: [
                {
                  address: PERMIT2_ADDRESS,
                  topics: [PERMIT2_APPROVAL_TOPIC, ownerTopic],
                  fromBlock: chunkFromBlock,
                  toBlock: chunkToBlock
                }
              ]
            }),
            callProvider<RawLog[]>({
              chainId: network.chainId,
              method: 'getLogs',
              args: [
                {
                  address: PERMIT2_ADDRESS,
                  topics: [PERMIT2_PERMIT_TOPIC, ownerTopic],
                  fromBlock: chunkFromBlock,
                  toBlock: chunkToBlock
                }
              ]
            }),
            callProvider<RawLog[]>({
              chainId: network.chainId,
              method: 'getLogs',
              args: [
                {
                  address: PERMIT2_ADDRESS,
                  topics: [PERMIT2_LOCKDOWN_TOPIC, ownerTopic],
                  fromBlock: chunkFromBlock,
                  toBlock: chunkToBlock
                }
              ]
            })
          ])

          const candidates = [
            ...permit2ApprovalLogs
              .sort(sortLogsNewestFirst)
              .map((log) => parsePermit2Log(log, network.chainId)),
            ...permit2PermitLogs
              .sort(sortLogsNewestFirst)
              .map((log) => parsePermit2Log(log, network.chainId)),
            ...permit2LockdownLogs
              .sort(sortLogsNewestFirst)
              .map((log) => parsePermit2Log(log, network.chainId))
          ].filter(Boolean) as ApprovalCandidate[]

          await applyLatestCandidates(candidates)
        }
      })

      state.completedPhases.add('permit2')
      state.nextFromBlockByPhase.permit2 = state.latestBlock + 1
      persistNetworkScanState({ cacheKey: scanStateKey, state })
    }

    if (!state.inFlightPromise) {
      state.inFlightPromise = (async () => {
        await scanTopicPhase({
          phase: 'approval',
          filter: { topics: [APPROVAL_TOPIC, ownerTopic] },
          parser: parseApprovalLog
        })
        await scanTopicPhase({
          phase: 'approvalForAll',
          filter: { topics: [APPROVAL_FOR_ALL_TOPIC, ownerTopic] },
          parser: parseApprovalForAllLog
        })
        await scanPermit2Phase()

        state.isCompleted = true
        persistNetworkScanState({ cacheKey: scanStateKey, state })

        return sortApprovalsForNetwork(Array.from(state.approvalsById.values()), network)
      })().finally(() => {
        state.inFlightPromise = undefined
      })
    }

    return await state.inFlightPromise
  } finally {
    if (subscriber) state.subscribers.delete(subscriber)
  }
}

export const fetchApprovalsForAccount = async ({
  accountAddr,
  networks,
  callProvider,
  onApprovalsDiscovered,
  onFailure
}: {
  accountAddr: string
  networks: Network[]
  callProvider: ProviderCaller
  onApprovalsDiscovered?: (approvals: ApprovalItem[]) => void
  onFailure?: (failure: ApprovalScanFailure) => void
}) => {
  const checksummedAccountAddr = normalizeAddress(accountAddr)

  const results = await runWithConcurrency(networks, NETWORK_SCAN_CONCURRENCY, async (network) => {
    try {
      const approvals = await scanNetworkApprovals({
        accountAddr: checksummedAccountAddr,
        network,
        callProvider,
        onApprovalsDiscovered
      })

      return { approvals, failure: null as ApprovalScanFailure | null }
    } catch (error) {
      const failure = {
        chainId: network.chainId,
        message: normalizeErrorMessage(error)
      }

      onFailure?.(failure)

      return {
        approvals: [] as ApprovalItem[],
        failure
      }
    }
  })

  const approvals = sortApprovals(
    results.flatMap((result) => result.approvals),
    networks
  )

  return {
    approvals,
    failures: results.flatMap((result) => (result.failure ? [result.failure] : []))
  }
}

const ensureCallDoesNotRevert = async ({
  chainId,
  accountAddr,
  to,
  data,
  callProvider
}: {
  chainId: bigint
  accountAddr: string
  to: string
  data: string
  callProvider: ProviderCaller
}) => {
  await callRaw({
    chainId,
    address: to,
    data,
    from: accountAddr,
    callProvider
  })
}

const buildRevokeCall = async ({
  approval,
  accountAddr,
  callProvider
}: {
  approval: ApprovalItem
  accountAddr: string
  callProvider: ProviderCaller
}): Promise<Call> => {
  switch (approval.kind) {
    case 'erc20': {
      const approveZeroData = ERC20_INTERFACE.encodeFunctionData('approve', [approval.spender, 0n])

      try {
        await ensureCallDoesNotRevert({
          chainId: approval.chainId,
          accountAddr,
          to: approval.tokenAddress,
          data: approveZeroData,
          callProvider
        })

        return {
          to: approval.tokenAddress,
          value: 0n,
          data: approveZeroData
        }
      } catch (error) {
        if (!approval.amount || approval.amount === 0n) {
          throw new Error(`Failed to prepare revoke for ${approval.tokenAddress}`)
        }

        const decreaseAllowanceData = ERC20_INTERFACE.encodeFunctionData('decreaseAllowance', [
          approval.spender,
          approval.amount
        ])

        await ensureCallDoesNotRevert({
          chainId: approval.chainId,
          accountAddr,
          to: approval.tokenAddress,
          data: decreaseAllowanceData,
          callProvider
        })

        return {
          to: approval.tokenAddress,
          value: 0n,
          data: decreaseAllowanceData
        }
      }
    }
    case 'erc721-single':
      if (approval.tokenId === undefined) {
        throw new Error(`Missing tokenId for ${approval.tokenAddress}`)
      }

      return {
        to: approval.tokenAddress,
        value: 0n,
        data: ERC721_INTERFACE.encodeFunctionData('approve', [ZeroAddress, approval.tokenId])
      }
    case 'erc721-all':
      return {
        to: approval.tokenAddress,
        value: 0n,
        data: ERC721_INTERFACE.encodeFunctionData('setApprovalForAll', [approval.spender, false])
      }
    case 'permit2':
      return {
        to: approval.permit2Address || PERMIT2_ADDRESS,
        value: 0n,
        data: PERMIT2_INTERFACE.encodeFunctionData('approve', [
          approval.tokenAddress,
          approval.spender,
          0n,
          approval.expiration || 0
        ])
      }
    default:
      throw new Error('Unsupported approval type')
  }
}

export const buildRevokeCalls = async ({
  approvals,
  accountAddr,
  callProvider
}: {
  approvals: ApprovalItem[]
  accountAddr: string
  callProvider: ProviderCaller
}) => {
  const groupedCallsByChainId = new Map<string, { chainId: bigint; calls: Call[] }>()

  for (const approval of approvals) {
    const call = await buildRevokeCall({
      approval,
      accountAddr,
      callProvider
    })
    const key = approval.chainId.toString()

    if (!groupedCallsByChainId.has(key)) {
      groupedCallsByChainId.set(key, { chainId: approval.chainId, calls: [] })
    }

    groupedCallsByChainId.get(key)!.calls.push(call)
  }

  return Array.from(groupedCallsByChainId.values())
}

export const isUnlimitedApproval = (approval: Pick<ApprovalItem, 'kind' | 'amount'>) => {
  if (!approval.amount) return false
  if (approval.kind === 'permit2') return approval.amount === MAX_UINT160

  return approval.amount === MaxUint256
}
