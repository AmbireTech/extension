import {
  PRIVACY_POOLS_COVER_WINDOW_DAYS,
  PRIVACY_POOLS_MIN_REASSURING_COVER,
  PRIVACY_POOLS_UNCHECKED_PRIVACY_TEXT
} from '@ambire-common/consts/privacyPools'
import {
  PrivacyPoolsLeak,
  PrivacyPoolsLeakAction,
  PrivacyPoolsRating
} from '@ambire-common/interfaces/privacyPools'
import { TextAppearance } from '@common/components/Text'
import { ThemeProps } from '@common/styles/themeConfig'
import { formatPrivacyPoolsAmount } from '@common/utils/privacyPools'

import { PrivacySeverity, PrivacyStage, PrivacyTone } from './types'

import type { TFunction } from 'i18next'

const COVER_WINDOW_DAYS = Number(PRIVACY_POOLS_COVER_WINDOW_DAYS)

const PRIVACY_TONE_COLORS: Record<
  PrivacyTone,
  { textAppearance: TextAppearance; iconColorKey: keyof ThemeProps }
> = {
  error: { textAppearance: 'errorText', iconColorKey: 'errorDecorative' },
  warning: { textAppearance: 'warningText', iconColorKey: 'warningDecorative' },
  info: { textAppearance: 'infoText', iconColorKey: 'infoDecorative' },
  neutral: { textAppearance: 'secondaryText', iconColorKey: 'iconSecondary' }
}

/** The text appearance and the icon color of a privacy line in `tone`. */
const getPrivacyToneColors = (theme: ThemeProps, tone: PrivacyTone) => {
  const { textAppearance, iconColorKey } = PRIVACY_TONE_COLORS[tone]

  return { textAppearance, iconColor: theme[iconColorKey] }
}

/** The text appearance of a leak's note. Its small icon takes the same color, to stay visible. */
const getLeakTextAppearance = (type: PrivacyPoolsLeak['type']): TextAppearance =>
  PRIVACY_TONE_COLORS[type].textAppearance

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
    ? t('1 deposit covers you')
    : t('{{count}} deposits cover you', { count: cover })
}

export {
  COVER_WINDOW_DAYS,
  getLeakTextAppearance,
  getPrivacyActionText,
  getPrivacySeverity,
  getPrivacyStatusText,
  getPrivacyToneColors
}
