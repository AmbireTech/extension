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

export const getDappTabIdsFromUserRequest = (userRequest?: UserRequest): number[] =>
  getDappTabTargetsFromUserRequest(userRequest).map(({ tabId }) => tabId)
