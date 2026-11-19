import type { WcSessionDetails } from './types'

/**
 * The details of live WalletConnect sessions, keyed by topic: when each was connected, when it
 * expires and whether its app answers right now.
 */
declare const useWcSessionsDetails: (topics: string[]) => Record<string, WcSessionDetails>

export default useWcSessionsDetails
