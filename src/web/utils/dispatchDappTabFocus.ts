import { UserRequest } from '@ambire-common/interfaces/userRequest'

export type DappTabTarget = {
  tabId: number
  windowId?: number
}

export const getDappTabTargetsFromUserRequest = (userRequest?: UserRequest): DappTabTarget[] => {
  if (!userRequest?.dappPromises?.length) return []

  const targets = new Map<number, DappTabTarget>()
  userRequest.dappPromises.forEach((promise) => {
    const tabId = promise.session?.tabId
    if (typeof tabId !== 'number') return

    targets.set(tabId, {
      tabId,
      windowId: promise.session?.windowId
    })
  })

  return [...targets.values()]
}

/**
 * The browser windows of the apps waiting on a request. Empty for a request without an app window
 * (e.g. started in the wallet itself, or over WalletConnect) - such a request can be shown in any
 * side panel, while the others belong to the panel of the app's own window.
 */
export const getAppWindowIdsFromUserRequest = (userRequest?: UserRequest | null): number[] =>
  getDappTabTargetsFromUserRequest(userRequest ?? undefined)
    .map(({ windowId }) => windowId)
    .filter((windowId): windowId is number => typeof windowId === 'number')

/**
 * Whether a request belongs to the side panel in the given window: it comes from an app in that
 * window, or from no app window at all. Mirrors the background, which shows a request in the panel
 * of the app's own window, so only that panel acts on it on its own - not every open panel. Before
 * the panel knows its window, only requests without an app window count.
 */
export const getIsUserRequestForPanelWindow = (
  userRequest: UserRequest | null | undefined,
  panelWindowId: number | undefined
) => {
  const requestWindowIds = getAppWindowIdsFromUserRequest(userRequest)
  if (!requestWindowIds.length) return true

  return panelWindowId !== undefined && requestWindowIds.includes(panelWindowId)
}

export const getDappTabIdsFromUserRequest = (userRequest?: UserRequest): number[] =>
  getDappTabTargetsFromUserRequest(userRequest).map(({ tabId }) => tabId)
