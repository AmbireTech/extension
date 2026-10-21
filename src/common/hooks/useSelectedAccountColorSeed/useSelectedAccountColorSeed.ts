import { useMemo } from 'react'

import useController from '@common/hooks/useController'
import { getPrivacyPoolsColorSeed } from '@common/utils/avatars'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccountAddr = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account?.addr

const selectPrivacyPoolsAccountId = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.privacyPoolsAccountId

/**
 * The selected account's color seed: its address, or `getPrivacyPoolsColorSeed` for a Privacy Pools
 * account. Always a valid address, even with nothing selected, as the color generators require it.
 */
const useSelectedAccountColorSeed = () => {
  const { state: accountAddr } = useController('SelectedAccountController', selectAccountAddr)
  const { state: privacyPoolsAccountId } = useController(
    'SelectedAccountController',
    selectPrivacyPoolsAccountId
  )

  return useMemo(
    () => accountAddr || getPrivacyPoolsColorSeed(privacyPoolsAccountId || ''),
    [accountAddr, privacyPoolsAccountId]
  )
}

export default useSelectedAccountColorSeed
