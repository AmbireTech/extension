import { getRequestToMoveOutOfPanel } from './getRequestToMoveOutOfPanel'

const APP_WINDOW_ID = 2

const makeRequest = ({
  id,
  kind,
  windowId,
  hasApp = true
}: {
  id: string
  kind: string
  windowId?: number
  hasApp?: boolean
}) =>
  ({
    id,
    kind,
    meta: {},
    dappPromises: hasApp
      ? [{ id, resolve: jest.fn(), reject: jest.fn(), session: { tabId: 1, windowId } }]
      : []
  }) as any

describe('getRequestToMoveOutOfPanel', () => {
  it('moves nothing when there are no requests', () => {
    expect(getRequestToMoveOutOfPanel([])).toBe(null)
  })

  it('leaves transactions queued', () => {
    const transaction = makeRequest({ id: 'tx', kind: 'calls', windowId: APP_WINDOW_ID })

    expect(getRequestToMoveOutOfPanel([transaction])).toBe(null)
  })

  it('moves nothing started in the wallet itself, which no app is waiting on', () => {
    const transfer = makeRequest({ id: 'transfer', kind: 'transfer', hasApp: false })

    expect(getRequestToMoveOutOfPanel([transfer])).toBe(null)
  })

  it("moves the first app request, even behind a transaction, next to the app's window", () => {
    const transaction = makeRequest({ id: 'tx', kind: 'calls', windowId: APP_WINDOW_ID })
    const message = makeRequest({ id: 'msg', kind: 'message', windowId: APP_WINDOW_ID })
    const connect = makeRequest({ id: 'connect', kind: 'dappConnect', windowId: APP_WINDOW_ID })

    expect(getRequestToMoveOutOfPanel([transaction, message, connect])).toEqual({
      request: message,
      baseWindowId: APP_WINDOW_ID
    })
  })

  it('leaves the base window unset for an app request without a window', () => {
    const message = makeRequest({ id: 'msg', kind: 'message' })

    expect(getRequestToMoveOutOfPanel([message])).toEqual({
      request: message,
      baseWindowId: undefined
    })
  })
})
