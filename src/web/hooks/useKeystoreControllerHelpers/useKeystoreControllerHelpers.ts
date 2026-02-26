import { useEffect, useMemo } from 'react'

import { setUserContext } from '@common/config/analytics/CrashAnalytics'
import useControllerState from '@common/hooks/useControllerState'
import { getExtensionInstanceId } from '@web/utils/analytics'

export default function useKeystoreControllerHelpers() {
  const { state: mainState } = useControllerState({ id: 'MainController' })
  const { state: keystoreState } = useControllerState({ id: 'KeystoreController' })

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
