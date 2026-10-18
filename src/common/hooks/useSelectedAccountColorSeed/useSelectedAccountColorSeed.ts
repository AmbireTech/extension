import { useMemo } from 'react'

import useController from '@common/hooks/useController'
import { getPrivacyPoolsColorSeed } from '@common/utils/avatars'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccountAddr = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account?.addr

const selectPrivateAccountSeedId = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.privateAccount?.seedId ?? null

/**
 * The selected account's color seed: its address, or `getPrivacyPoolsColorSeed` for a Privacy Pools
 * account. Always a valid address, even with nothing selected, as the color generators require it.
 */
const useSelectedAccountColorSeed = () => {
  const { state: accountAddr } = useController('SelectedAccountController', selectAccountAddr)
  const { state: privateAccountSeedId } = useController(
    'SelectedAccountController',
    selectPrivateAccountSeedId
  )

  return useMemo(
    () => accountAddr || getPrivacyPoolsColorSeed(privateAccountSeedId || ''),
    [accountAddr, privateAccountSeedId]
  )
}

export default useSelectedAccountColorSeed
