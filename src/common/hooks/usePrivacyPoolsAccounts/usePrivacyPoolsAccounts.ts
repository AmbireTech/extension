import { useMemo } from 'react'

import type { TFunction } from 'i18next'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** A Privacy Pools account resolved against its recovery phrase, for display. */
export type PrivacyPoolsAccountDisplay = {
  seedId: string
  /** The name the user gave it, or "Private account" for one added before accounts had names */
  name: string
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

/** Filters accounts by name, where they are from and kind - they have no address or key to search by. */
export const filterPrivacyPoolsAccountsBySearch = (
  accounts: PrivacyPoolsAccountDisplay[],
  search: string,
  /** Translated account kind, e.g. "Privacy Pools". */
  kindLabel: string
) => {
  const query = search.trim().toLowerCase()
  if (!query) return accounts

  return accounts.filter(({ name, sourceLabel }) =>
    `${name} ${sourceLabel} ${kindLabel}`.toLowerCase().includes(query)
  )
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
      (privacyPoolsAccounts || []).map(({ seedId, label: name }) => {
        const seed = (seeds || []).find(({ id }) => id === seedId)

        return {
          seedId,
          name: name || t('Private account'),
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
