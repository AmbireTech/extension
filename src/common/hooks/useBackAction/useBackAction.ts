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
 * Returns whether the press was consumed, so the caller can let Android send the app to
 * the background when there is nothing left to go back to.
 */
const useBackAction = () => {
  const { goBack, canGoBack } = useNavigation()
  const { path } = useRoute()

  return useCallback(() => {
    // Ahead of the root route check, because a sheet is dismissed even on a screen there
    // is no going back from. Modalize registers its own handler when a sheet opens and
    // usually gets the press first, so this only catches the orderings where it does not.
    if (openBottomSheetsCount.value > 0) {
      bottomSheetCloseEventStream.next()

      return true
    }

    if (MOBILE_ROOT_ROUTE_PATHS.includes(path) || !canGoBack) return false

    if (goBackInWebViewHistory()) return true

    goBack()

    return true
  }, [path, canGoBack, goBack])
}

export default useBackAction
