import { ViewStyle } from 'react-native'

import { PrivacyPoolsLeak, PrivacyPoolsRating } from '@ambire-common/interfaces/privacyPools'

/** Where the status shows. A deposit is hidden among deposits of its exact amount. */
type PrivacyStage = 'deposit' | 'send'

/** How bad the privacy of a transfer looks, which sets its colors. */
type PrivacySeverity = 'error' | 'warning' | 'ok'

type PrivacyStatusProps = {
  stage: PrivacyStage
  rating: PrivacyPoolsRating
  leaks: PrivacyPoolsLeak[]
  /**
   * How many deposits hide the transfer: of the same amount for a deposit, large enough to pay it
   * for a send.
   */
  cover: number
  decimals: number
  symbol: string
  /** Fixes a leak with another amount. Without it, no fix is offered, as on a proved transfer. */
  onSetAmount?: (amount: bigint) => void
  style?: ViewStyle
}

export type { PrivacySeverity, PrivacyStage, PrivacyStatusProps }
