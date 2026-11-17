import { useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { Key } from '@ambire-common/interfaces/keystore'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

/**
 * The keystore keys that can sign for the given account. Lets a component subscribe to
 * the keystore once and hand the result to its children, instead of every child taking
 * a subscription of its own - which matters in a list, where the children repeat per row.
 */
const useAccountKeys = (account?: Account | null): Key[] => {
  const { state: keys } = useController('KeystoreController', selectKeys)

  return useMemo(
    () => keys.filter((key) => !!account?.associatedKeys.includes(key.addr)),
    [account, keys]
  )
}

export default useAccountKeys
