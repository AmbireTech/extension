import {
  PRIVACY_POOLS_COVER_WINDOW_DAYS,
  PRIVACY_POOLS_UNCHECKED_PRIVACY_TEXT
} from '@ambire-common/consts/privacyPools'
import { PrivacyPoolsLeakAction, PrivacyPoolsRating } from '@ambire-common/interfaces/privacyPools'
import { formatPrivacyPoolsAmount } from '@common/utils/privacyPools'

import type { TFunction } from 'i18next'

const COVER_WINDOW_DAYS = Number(PRIVACY_POOLS_COVER_WINDOW_DAYS)

/** The button text of a fix, like "Use a common amount: 0.1 ETH". */
const getPrivacyActionText = (
  t: TFunction,
  { label, meta }: PrivacyPoolsLeakAction,
  decimals: number,
  symbol: string
): string => `${t(label)}: ${formatPrivacyPoolsAmount(meta.amount, decimals, symbol)}`

/** How many recent deposits hide the transfer, with the days counted. */
const getPrivacyCoverText = (t: TFunction, cover: number): string =>
  cover === 1
    ? t('1 deposit covers you ({{days}}d)', { days: COVER_WINDOW_DAYS })
    : t('{{count}} deposits cover you ({{days}}d)', { count: cover, days: COVER_WINDOW_DAYS })

/**
 * The status line of a transfer: its cover, or that nothing could be checked yet. Leaves out the
 * days counted, which only the privacy details have room for.
 */
const getPrivacyStatusText = (t: TFunction, rating: PrivacyPoolsRating, cover: number): string => {
  if (rating === 'unchecked') return t(PRIVACY_POOLS_UNCHECKED_PRIVACY_TEXT)

  return cover === 1
    ? t('1 deposit covers you')
    : t('{{count}} deposits cover you', { count: cover })
}

export { COVER_WINDOW_DAYS, getPrivacyActionText, getPrivacyCoverText, getPrivacyStatusText }
