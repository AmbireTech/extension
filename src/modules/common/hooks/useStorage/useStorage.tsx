import useStorage, { UseStorageProps } from 'ambire-common/src/hooks/useStorage'

import useStorageController from '../useStorageController'

export default function useSyncStorage<ValueType>({
  key,
  defaultValue,
  isStringStorage,
  setInit
}: Omit<UseStorageProps<ValueType>, 'storage'>) {
  const storage = useStorageController()

  return useStorage<ValueType>({
    storage,
    key,
    defaultValue,
    isStringStorage,
    setInit
  })
}
