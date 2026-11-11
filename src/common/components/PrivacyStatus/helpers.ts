import {
  PRIVACY_POOLS_COVER_WINDOW_DAYS,
  PRIVACY_POOLS_MIN_REASSURING_COVER,
  PRIVACY_POOLS_UNCHECKED_PRIVACY_TEXT
} from '@ambire-common/consts/privacyPools'
import { PrivacyPoolsLeakAction, PrivacyPoolsRating } from '@ambire-common/interfaces/privacyPools'
import { formatPrivacyPoolsAmount } from '@common/utils/privacyPools'

import { PrivacySeverity, PrivacyStage } from './types'

import type { TFunction } from 'i18next'

const COVER_WINDOW_DAYS = Number(PRIVACY_POOLS_COVER_WINDOW_DAYS)

/** The button text of a fix, like "Use a common amount: 0.1 ETH". */
const getPrivacyActionText = (
  t: TFunction,
  { label, meta }: PrivacyPoolsLeakAction,
  decimals: number,
  symbol: string
): string => `${t(label)}: ${formatPrivacyPoolsAmount(meta.amount, decimals, symbol)}`

/**
 * How bad the privacy of a transfer looks. A send hidden among few deposits, or not checked at all,
 * is a `warning` even without a leak. A deposit's amount can still be sent out in other amounts, so
 * for it they are `ok`.
 */
const getPrivacySeverity = (
  stage: PrivacyStage,
  rating: PrivacyPoolsRating,
  cover: number
): PrivacySeverity => {
  if (rating === 'traceable') return 'error'
  if (rating === 'weak') return 'warning'
  if (stage === 'send' && (rating === 'unchecked' || cover < PRIVACY_POOLS_MIN_REASSURING_COVER))
    return 'warning'

  return 'ok'
}

/**
 * The status line of a transfer: its cover, or that nothing could be checked yet. Leaves out the
 * days counted, which only the privacy details have room for.
 */
const getPrivacyStatusText = (t: TFunction, rating: PrivacyPoolsRating, cover: number): string => {
  if (rating === 'unchecked') return t(PRIVACY_POOLS_UNCHECKED_PRIVACY_TEXT)

  return cover === 1
    ? t('1 deposit like yours')
    : t('{{count}} deposits like yours', { count: cover })
}

export { COVER_WINDOW_DAYS, getPrivacyActionText, getPrivacySeverity, getPrivacyStatusText }
