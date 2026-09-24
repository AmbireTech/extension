import { useMemo } from 'react'

import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** A Privacy Pools account as the UI shows it, resolved against the recovery phrase it is from. */
export type PrivacyPoolsAccountDisplay = {
  seedId: string
  /**
   * The label of its recovery phrase: the account has no name or address of its own, and the
   * phrase is what tells two of them apart.
   */
  label: string
  /** Whether its recovery phrase has been written down - the only way to recover the account. */
  isBackedUp: boolean
}

/**
 * The accounts a search matches. They are matched on their name and on what they are, since that
 * is all they have - there is no address or key to search by.
 */
export const filterPrivacyPoolsAccountsBySearch = (
  accounts: PrivacyPoolsAccountDisplay[],
  search: string,
  /** How the kind of account reads in the user's language, e.g. "Privacy Pools". */
  kindLabel: string
) => {
  const query = search.trim().toLowerCase()
  if (!query) return accounts

  return accounts.filter(({ label }) => `${label} ${kindLabel}`.toLowerCase().includes(query))
}

const selectPrivacyPoolsAccounts = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.accounts
const selectSeeds = (state: AllControllersMappingType['KeystoreController']) => state.seeds
const selectPrivacyPoolsAccountId = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.privacyPoolsAccountId

/**
 * The wallet's Privacy Pools accounts and the selected one, ready to render.
 *
 * Neither controller they come from is needed before the first paint, so both can still be empty
 * here - the selected id is always known, as it comes with the selected account.
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
      (privacyPoolsAccounts || []).map(({ seedId }) => {
        const seed = (seeds || []).find(({ id }) => id === seedId)

        return {
          seedId,
          label: seed?.label || t('Privacy Pools account'),
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
