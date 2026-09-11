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

export const getDappTabIdsFromUserRequest = (userRequest?: UserRequest): number[] =>
  getDappTabTargetsFromUserRequest(userRequest).map(({ tabId }) => tabId)
