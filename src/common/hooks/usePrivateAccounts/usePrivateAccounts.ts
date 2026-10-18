import { useMemo } from 'react'

import { PrivacyProviderId } from '@ambire-common/interfaces/privateAccount'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { PRIVACY_PROVIDER_NAMES } from '@common/modules/privacy/providers'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** A private account of any provider, resolved against its recovery phrase, for display. */
export type PrivateAccountDisplay = {
  providerId: PrivacyProviderId
  seedId: string
  /** Its recovery phrase's label - the account has no name or address of its own. */
  label: string
  /** Whether its recovery phrase is backed up - the only way to recover the account. */
  isBackedUp: boolean
}

const selectPrivacyPoolsAccounts = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.accounts
const selectTornadoCashAccounts = (state: AllControllersMappingType['TornadoCashController']) =>
  state.accounts
const selectSeeds = (state: AllControllersMappingType['KeystoreController']) => state.seeds
const selectPrivateAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.privateAccount

/** Filters accounts by label and provider - they have no address or key to search by. */
export const filterPrivateAccountsBySearch = (
  accounts: PrivateAccountDisplay[],
  search: string
) => {
  const query = search.trim().toLowerCase()
  if (!query) return accounts

  return accounts.filter(({ label, providerId }) =>
    `${label} ${PRIVACY_PROVIDER_NAMES[providerId]}`.toLowerCase().includes(query)
  )
}

/** A key that tells private accounts apart across providers, for lists and comparisons. */
export const getPrivateAccountKey = ({
  providerId,
  seedId
}: {
  providerId: PrivacyProviderId
  seedId: string
}) => `${providerId}:${seedId}`

/**
 * The wallet's private accounts of every provider, Privacy Pools ones first, and the selected one.
 * The accounts may still be empty on first paint.
 */
const usePrivateAccounts = () => {
  const { t } = useTranslation()
  const { state: privacyPoolsAccounts } = useController(
    'PrivacyPoolsController',
    selectPrivacyPoolsAccounts
  )
  const { state: tornadoCashAccounts } = useController(
    'TornadoCashController',
    selectTornadoCashAccounts
  )
  const { state: seeds } = useController('KeystoreController', selectSeeds)
  const { state: selectedPrivateAccount } = useController(
    'SelectedAccountController',
    selectPrivateAccount
  )

  const accounts: PrivateAccountDisplay[] = useMemo(() => {
    const toDisplay = (providerId: PrivacyProviderId, seedId: string): PrivateAccountDisplay => {
      const seed = (seeds || []).find(({ id }) => id === seedId)

      return {
        providerId,
        seedId,
        label:
          seed?.label ||
          t('{{provider}} account', { provider: PRIVACY_PROVIDER_NAMES[providerId] }),
        isBackedUp: !seed?.notBackedUp
      }
    }

    return [
      ...(privacyPoolsAccounts || []).map(({ seedId }) => toDisplay('privacyPools', seedId)),
      ...(tornadoCashAccounts || []).map(({ seedId }) => toDisplay('tornadoCash', seedId))
    ]
  }, [privacyPoolsAccounts, seeds, t, tornadoCashAccounts])

  const selectedAccount = useMemo(
    () =>
      accounts.find(
        ({ providerId, seedId }) =>
          providerId === selectedPrivateAccount?.providerId &&
          seedId === selectedPrivateAccount?.seedId
      ) || null,
    [accounts, selectedPrivateAccount]
  )

  return { accounts, selectedAccount }
}

export default usePrivateAccounts
