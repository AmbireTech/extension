import type { TFunction } from 'i18next'

/**
 * Joins names into a translated list, e.g. "Ledger, Trezor and GridPlus", or with `or`
 * "ETH, USDC or USDT"
 */
const joinNames = (names: string[], t: TFunction, conjunction: 'and' | 'or' = 'and'): string => {
  if (names.length <= 1) return names[0] || ''

  const params = { names: names.slice(0, -1).join(', '), lastName: names[names.length - 1] }

  if (conjunction === 'or') return t('{{names}} or {{lastName}}', params)

  return t('{{names}} and {{lastName}}', params)
}

export default joinNames
