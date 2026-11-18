/** `checking` until the app on the other end answers a ping or the ping times out */
export type WcSessionStatus = 'checking' | 'active' | 'inactive'

export interface WcSessionDetails {
  /** Unknown for sessions approved before it was recorded */
  connectedAt?: number
  expiresInSeconds?: number
  status: WcSessionStatus
}
