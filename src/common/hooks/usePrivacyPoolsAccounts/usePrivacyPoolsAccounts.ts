import Fuse from 'fuse.js'
import { useMemo } from 'react'

import type { TFunction } from 'i18next'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** A Privacy Pools account resolved against its recovery phrase, for display. */
export type PrivacyPoolsAccountDisplay = {
  seedId: string
  /** The name the user gave it, or "Private account" for one added before accounts had names */
  label: string
  /**
   * Its recovery phrase's label, with the passphrase's name for a phrase added with one - the
   * account has no address of its own
   */
  sourceLabel: string
  /** Whether its recovery phrase is backed up - the only way to recover the account. */
  isBackedUp: boolean
}

/**
 * Where a Privacy Pools account is from: its recovery phrase's label, with the passphrase's name
 * for a phrase added with one
 */
export const getPrivacyPoolsSourceLabel = (
  seedLabel: string,
  passphraseLabel: string | undefined,
  t: TFunction
) =>
  passphraseLabel
    ? t('{{seedLabel}} · Passphrase {{passphraseLabel}}', { seedLabel, passphraseLabel })
    : seedLabel

// Matches the regular accounts' search in `useAccountsList`, so a typo hides neither group
const FUSE_OPTIONS = {
  keys: [
    { name: 'label', weight: 0.5 },
    { name: 'sourceLabel', weight: 0.3 },
    { name: 'kindLabels', weight: 0.2 }
  ],
  threshold: 0.3,
  ignoreLocation: false,
  distance: 1000
}

/**
 * Filters accounts by name, where they are from and kind - they have no address or key to search
 * by. Fuzzy like the regular accounts' search, so pass it the same (debounced) search value.
 */
export const filterPrivacyPoolsAccountsBySearch = (
  accounts: PrivacyPoolsAccountDisplay[],
  search: string,
  t: TFunction
) => {
  const query = search.trim()
  if (!query) return accounts

  // Both names the UI calls them by
  const kindLabels = `${t('Private account')} ${t('Privacy Pools')}`
  const searchableAccounts = accounts.map((account) => ({
    account,
    label: account.label,
    sourceLabel: account.sourceLabel,
    kindLabels
  }))

  return new Fuse(searchableAccounts, FUSE_OPTIONS).search(query).map(({ item }) => item.account)
}

const selectPrivacyPoolsAccounts = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.accounts
const selectSeeds = (state: AllControllersMappingType['KeystoreController']) => state.seeds
const selectPrivacyPoolsAccountId = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.privacyPoolsAccountId

/**
 * The wallet's Privacy Pools accounts and the selected one. The accounts may still be empty on
 * first paint; the selected id is always known.
 */
const usePrivacyPoolsAccounts = () => {
  const { t } = useTranslation()
  const { state: privacyPoolsAccounts } = useController(
    'PrivacyPoolsController',
    selectPrivacyPoolsAccounts
  )
  const { state: seeds } = useController('KeystoreController', selectSeeds)
  const { state: selectedAccountId } = useController(
    'SelectedAccountController',
    selectPrivacyPoolsAccountId
  )

  const accounts: PrivacyPoolsAccountDisplay[] = useMemo(
    () =>
      (privacyPoolsAccounts || []).map(({ seedId, label }) => {
        const seed = (seeds || []).find(({ id }) => id === seedId)

        return {
          seedId,
          label: label || t('Private account'),
          sourceLabel: getPrivacyPoolsSourceLabel(
            seed?.label || t('Privacy Pools account'),
            seed?.passphraseLabel,
            t
          ),
          isBackedUp: !seed?.notBackedUp
        }
      }),
    [privacyPoolsAccounts, seeds, t]
  )

  const selectedAccount = useMemo(
    () => accounts.find(({ seedId }) => seedId === selectedAccountId) || null,
    [accounts, selectedAccountId]
  )

  return { accounts, selectedAccount, selectedAccountId: selectedAccountId ?? null }
}

export default usePrivacyPoolsAccounts
