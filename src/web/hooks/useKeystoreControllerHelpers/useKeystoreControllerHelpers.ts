import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

import { setUserContext } from '@common/config/analytics/CrashAnalytics'
import { ControllerStore } from '@common/contexts/controllerStoreContext/controllerStore'
import { getExtensionInstanceId } from '@web/utils/analytics'

export default function useKeystoreControllerHelpers(controllerStore: ControllerStore) {
  const mainState = useSyncExternalStore(
    useCallback((cb) => controllerStore.subscribe('MainController', cb), [controllerStore]),
    useCallback(() => controllerStore.getSnapshot('MainController'), [controllerStore])
  )

  const keystoreState = useSyncExternalStore(
    useCallback((cb) => controllerStore.subscribe('KeystoreController', cb), [controllerStore]),
    useCallback(() => controllerStore.getSnapshot('KeystoreController'), [controllerStore])
  )

  const verifiedCode = useMemo(
    () => mainState.invite?.verifiedCode || '',
    [mainState.invite?.verifiedCode]
  )

  const keyStoreUid = useMemo(() => keystoreState.keyStoreUid, [keystoreState.keyStoreUid])

  useEffect(() => {
    if (!keyStoreUid) return

    setUserContext({ id: getExtensionInstanceId(keyStoreUid, verifiedCode) })
  }, [keyStoreUid, verifiedCode])
}
