import { useCallback } from 'react'

import {
  bottomSheetCloseEventStream,
  openBottomSheetsCount
} from '@common/components/BottomSheet/bottomSheetEventStream'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { MOBILE_ROOT_ROUTE_PATHS } from '@common/modules/router/constants/common'
import { goBackInWebViewHistory } from '@common/services/webview/webViewBackNavigation'

/**
 * What "back" means on mobile, in order: dismiss any open bottom sheet, walk the in-app
 * browser's page history, then pop the route. Used by the Android hardware back button;
 * the swipe is the platform's own, and the stack reconciles the router with it.
 */
const useBackAction = () => {
  const { goBack, canGoBack } = useNavigation()
  const { path } = useRoute()

  return useCallback(() => {
    if (MOBILE_ROOT_ROUTE_PATHS.includes(path) || !canGoBack) return

    if (openBottomSheetsCount.value > 0) {
      bottomSheetCloseEventStream.next()

      return
    }

    if (goBackInWebViewHistory()) return

    goBack()
  }, [path, canGoBack, goBack])
}

export default useBackAction
