import { AbiCoder, Interface, keccak256, parseUnits } from 'ethers'

export interface PendingWalletWithdrawal {
  shares: bigint
  unlocksAt: bigint
  maxTokens: bigint
}

export interface WalletStakingRelayerLog {
  topics: string[]
  data: string
}

interface WalletStakingRelayerLogsResponse {
  success: true
  data: {
    logs: WalletStakingRelayerLog[]
  }
}

interface CachedPendingWalletWithdrawal {
  shares: string
  unlocksAt: string
  maxTokens: string
}

export const walletStakingInterface = new Interface([
  'function commitments(bytes32) view returns (uint256)',
  'function withdraw(uint256 shares, uint256 unlocksAt, bool skipMint)',
  'event LogLeave(address indexed owner, uint256 shares, uint256 unlocksAt, uint256 maxTokens)'
])

export const LOG_LEAVE_TOPIC = walletStakingInterface.getEvent('LogLeave')!.topicHash
export const X_WALLET_PENDING_WITHDRAWAL_THRESHOLD = parseUnits('0.01', 18)

/** Uses the lock-time flow only when the account still holds a meaningful xWALLET balance. */
export const shouldUsePendingWalletWithdrawalMode = (
  pendingWithdrawal: PendingWalletWithdrawal | null,
  xWalletBalance: bigint
) => !!pendingWithdrawal && xWalletBalance >= X_WALLET_PENDING_WITHDRAWAL_THRESHOLD

/** Validates and extracts raw WALLET staking logs returned by the relayer. */
export const parseWalletStakingRelayerLogsResponse = (
  value: unknown
): WalletStakingRelayerLog[] => {
  if (!value || typeof value !== 'object') throw new Error('The relayer returned invalid data.')

  const response = value as Partial<WalletStakingRelayerLogsResponse> & { message?: unknown }
  if (response.success !== true) {
    throw new Error(
      typeof response.message === 'string'
        ? response.message
        : 'The relayer could not load pending withdrawals.'
    )
  }

  const logs = response.data?.logs
  if (
    !Array.isArray(logs) ||
    logs.some(
      (log) =>
        !log ||
        typeof log !== 'object' ||
        !Array.isArray(log.topics) ||
        log.topics.some((topic) => typeof topic !== 'string') ||
        typeof log.data !== 'string'
    )
  ) {
    throw new Error('The relayer returned invalid pending withdrawal data.')
  }

  return logs
}

/** Returns an account-specific key for the persisted pending withdrawal cache. */
export const getPendingWalletWithdrawalStorageKey = (accountAddr: string) =>
  `walletStakingPendingWithdrawal:${accountAddr.toLowerCase()}`

/** Converts a persisted pending withdrawal into its runtime bigint representation. */
export const parseCachedPendingWalletWithdrawal = (
  value: unknown
): PendingWalletWithdrawal | null => {
  if (!value || typeof value !== 'object') return null

  const { shares, unlocksAt, maxTokens } = value as Partial<CachedPendingWalletWithdrawal>
  if (
    typeof shares !== 'string' ||
    typeof unlocksAt !== 'string' ||
    typeof maxTokens !== 'string'
  ) {
    return null
  }

  try {
    const pendingWithdrawal = {
      shares: BigInt(shares),
      unlocksAt: BigInt(unlocksAt),
      maxTokens: BigInt(maxTokens)
    }

    if (
      pendingWithdrawal.shares <= 0n ||
      pendingWithdrawal.unlocksAt <= 0n ||
      pendingWithdrawal.maxTokens <= 0n
    ) {
      return null
    }

    return pendingWithdrawal
  } catch {
    return null
  }
}

/** Converts a pending withdrawal into a storage-safe representation. */
export const serializePendingWalletWithdrawal = (
  pendingWithdrawal: PendingWalletWithdrawal
): CachedPendingWalletWithdrawal => ({
  shares: pendingWithdrawal.shares.toString(),
  unlocksAt: pendingWithdrawal.unlocksAt.toString(),
  maxTokens: pendingWithdrawal.maxTokens.toString()
})

/** Decodes WALLET staking leave events owned by the selected account. */
export const decodePendingWalletWithdrawals = (
  logs: WalletStakingRelayerLog[],
  accountAddr: string
): PendingWalletWithdrawal[] =>
  logs.flatMap(({ topics, data }) => {
    if (topics[0]?.toLowerCase() !== LOG_LEAVE_TOPIC.toLowerCase()) return []

    const { owner, shares, unlocksAt, maxTokens } = walletStakingInterface.decodeEventLog(
      'LogLeave',
      data,
      topics
    )
    if (String(owner).toLowerCase() !== accountAddr.toLowerCase()) return []

    return [
      {
        shares: BigInt(shares),
        unlocksAt: BigInt(unlocksAt),
        maxTokens: BigInt(maxTokens)
      }
    ]
  })

/** Calculates the commitment key stored by the WALLET staking contract. */
export const getPendingWalletWithdrawalCommitmentId = (
  accountAddr: string,
  pendingWithdrawal: PendingWalletWithdrawal
) =>
  keccak256(
    AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256', 'uint256'],
      [accountAddr, pendingWithdrawal.shares, pendingWithdrawal.unlocksAt]
    )
  )

/** Formats a future unlock timestamp as a compact day, hour and minute countdown. */
export const formatPendingWalletWithdrawalDuration = (
  unlocksAt: bigint,
  nowMs: number = Date.now()
) => {
  const remainingMinutes = Math.max(0, Math.ceil((Number(unlocksAt) * 1000 - nowMs) / 60_000))
  const days = Math.floor(remainingMinutes / 1440)
  const hours = Math.floor((remainingMinutes % 1440) / 60)
  const minutes = remainingMinutes % 60

  return `${days}d ${hours}h ${minutes}m`
}

/** The contract only permits withdrawal after, rather than exactly at, unlocksAt. */
export const isPendingWalletWithdrawalReady = (unlocksAt: bigint, nowMs: number = Date.now()) =>
  BigInt(Math.floor(nowMs / 1000)) > unlocksAt
