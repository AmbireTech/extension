import { useEffect } from 'react'

import { KeystoreController } from '@ambire-common/controllers/keystore/keystore'
import { MainController } from '@ambire-common/controllers/main/main'
import { setUserContext } from '@common/config/analytics/CrashAnalytics'
import { getExtensionInstanceId } from '@web/utils/analytics'

export function useKeystoreController(state: KeystoreController, mainState: MainController) {
  useEffect(() => {
    if (!state.keyStoreUid) return

    setUserContext({
      id: getExtensionInstanceId(state.keyStoreUid, mainState?.invite?.verifiedCode || '')
    })
  }, [mainState?.invite?.verifiedCode, state.keyStoreUid])
}
