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

/** The wallet's private accounts of every provider, Privacy Pools ones first. */
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

  return { accounts }
}

export default usePrivateAccounts
