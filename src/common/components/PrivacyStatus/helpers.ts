import {
  PRIVACY_POOLS_COVER_WINDOW_DAYS,
  PRIVACY_POOLS_UNCHECKED_PRIVACY_TEXT
} from '@ambire-common/consts/privacyPools'
import { PrivacyPoolsLeakAction, PrivacyPoolsRating } from '@ambire-common/interfaces/privacyPools'
import { formatPrivacyPoolsAmount } from '@common/utils/privacyPools'

import { PrivacyStage } from './types'

import type { TFunction } from 'i18next'

const COVER_WINDOW_DAYS = Number(PRIVACY_POOLS_COVER_WINDOW_DAYS)

/** The button text of a fix, like "Use a common amount: 0.1 ETH". */
const getPrivacyActionText = (
  t: TFunction,
  { label, meta }: PrivacyPoolsLeakAction,
  decimals: number,
  symbol: string
): string => `${t(label)}: ${formatPrivacyPoolsAmount(meta.amount, decimals, symbol)}`

/** How many recent deposits hide the transfer, in the words of its stage. */
const getPrivacyCoverText = (t: TFunction, stage: PrivacyStage, cover: number): string => {
  if (stage === 'deposit') {
    return cover === 1
      ? t('1 deposit has this amount (last {{days}} days)', { days: COVER_WINDOW_DAYS })
      : t('{{count}} deposits have this amount (last {{days}} days)', {
          count: cover,
          days: COVER_WINDOW_DAYS
        })
  }

  return cover === 1
    ? t('1 deposit covers you (last {{days}} days)', { days: COVER_WINDOW_DAYS })
    : t('{{count}} deposits cover you (last {{days}} days)', {
        count: cover,
        days: COVER_WINDOW_DAYS
      })
}

/** The status line of a transfer: its cover, or that nothing could be checked yet. */
const getPrivacyStatusText = (
  t: TFunction,
  stage: PrivacyStage,
  rating: PrivacyPoolsRating,
  cover: number
): string =>
  rating === 'unchecked'
    ? t(PRIVACY_POOLS_UNCHECKED_PRIVACY_TEXT)
    : getPrivacyCoverText(t, stage, cover)

export { COVER_WINDOW_DAYS, getPrivacyActionText, getPrivacyCoverText, getPrivacyStatusText }
