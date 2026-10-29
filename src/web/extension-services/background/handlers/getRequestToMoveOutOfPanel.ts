import { UserRequest } from '@ambire-common/interfaces/userRequest'
import { getAppWindowIdsFromUserRequest } from '@web/utils/dispatchDappTabFocus'

/**
 * The request to move to a request window when side panel mode is turned off, and the window to
 * open it next to (its app's). Only one an app is waiting on, as closing the panel would reject it:
 * the first in the queue, even behind a transaction. Transactions stay queued, as when the panel is
 * closed. Null when there's nothing to move.
 */
export const getRequestToMoveOutOfPanel = (
  visibleUserRequests: UserRequest[]
): { request: UserRequest; baseWindowId: number | undefined } | null => {
  const request = visibleUserRequests.find(
    ({ kind, dappPromises }) => kind !== 'calls' && !!dappPromises?.length
  )
  if (!request) return null

  const [baseWindowId] = getAppWindowIdsFromUserRequest(request)

  return { request, baseWindowId }
}
