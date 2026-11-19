import type { WcSessionDetails } from './types'

// WalletConnect sessions are only listed on mobile
const useWcSessionsDetails = (): Record<string, WcSessionDetails> => ({})

export default useWcSessionsDetails
