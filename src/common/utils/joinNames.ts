import type { TFunction } from 'i18next'

/** Joins names into a translated list, e.g. "Ledger, Trezor and GridPlus" */
const joinNames = (names: string[], t: TFunction): string => {
  if (names.length <= 1) return names[0] || ''
  return t('{{names}} and {{lastName}}', {
    names: names.slice(0, -1).join(', '),
    lastName: names[names.length - 1]
  })
}

export default joinNames
