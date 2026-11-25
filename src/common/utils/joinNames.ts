import type { TFunction } from 'i18next'

/**
 * Joins names into a translated list, e.g. "Ledger, Trezor and GridPlus", or with `or`
 * "ETH, USDC or USDT"
 */
const joinNames = (names: string[], t: TFunction, conjunction: 'and' | 'or' = 'and'): string => {
  if (names.length <= 1) return names[0] || ''

  return t('{{names}} {{conjunction}} {{lastName}}', {
    names: names.slice(0, -1).join(', '),
    conjunction: t(conjunction),
    lastName: names[names.length - 1]
  })
}

export default joinNames
