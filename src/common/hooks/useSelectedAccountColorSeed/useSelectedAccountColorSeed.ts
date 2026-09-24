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
 * What the selected account's colors are seeded with, for anything tinted after it: a regular
 * account's address, or a value derived from a Privacy Pools account's recovery phrase id, since
 * that account has no address. Always a valid address, even with nothing selected, because the
 * avatar color generators throw on anything else.
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
