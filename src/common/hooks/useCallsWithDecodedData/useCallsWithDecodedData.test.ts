/**
 * @jest-environment jsdom
 */
import { act, createElement } from 'react'
import { createRoot, Root } from 'react-dom/client'

import type { DecodedCall } from '@ambire-common/interfaces/decodeCall'
import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
import { captureException } from '@common/config/analytics/CrashAnalytics'

import useCallsWithDecodedData from './useCallsWithDecodedData'

jest.mock('@common/config/analytics/CrashAnalytics', () => ({ captureException: jest.fn() }))

const mockDispatchAndWait = jest.fn()
jest.mock('@common/hooks/useController', () => ({
  __esModule: true,
  default: () => ({ dispatchAndWait: mockDispatchAndWait })
}))

const CONTRACT = '0x3333333333333333333333333333333333333333'
const TRANSFER_DATA = '0xa9059cbb0000'
const APPROVE_DATA = '0x095ea7b30000'
const UNKNOWN_DATA = '0xdeadbeef0000'

const TRANSFER_DECODED: DecodedCall = {
  selector: '0xa9059cbb',
  signature: 'transfer(address,uint256)',
  args: [],
  diffInBytes: 0
}
const APPROVE_DECODED: DecodedCall = {
  selector: '0x095ea7b3',
  signature: 'approve(address,uint256)',
  args: [],
  diffInBytes: 0
}

const toCall = (data: string, extra: Partial<IrCall> = {}): IrCall => ({
  to: CONTRACT,
  value: 0n,
  data,
  fullVisualization: [{ type: 'label', content: 'plain view', id: 1 }],
  ...extra
})

type Deferred = {
  resolve: (decodedCalls: (DecodedCall | null)[]) => void
  reject: (error: Error) => void
}

/** Makes every request wait until the test answers it through the returned list. */
const holdRequests = () => {
  const pendingRequests: Deferred[] = []
  mockDispatchAndWait.mockImplementation(
    () =>
      new Promise((resolve, reject) => {
        pendingRequests.push({ resolve, reject })
      })
  )

  return pendingRequests
}

const requestedCallDatas = () =>
  mockDispatchAndWait.mock.calls.map(([action]) => action.params.args[0] as string[])

const describeCalls = (calls: IrCall[]) =>
  calls.map((call) => ({ data: call.data, decodedSignature: call.decodedCall?.signature }))

/** Renders the hook and keeps every value it returned, with a way to render it with new calls. */
const renderHook = (initialCalls: IrCall[]) => {
  // React 18+ refuses to flush effects inside act() without this flag
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

  const results: IrCall[][] = []
  const Consumer = ({ calls }: { calls: IrCall[] }) => {
    results.push(useCallsWithDecodedData(calls))

    return null
  }
  const root: Root = createRoot(document.createElement('div'))
  const render = (calls: IrCall[]) => {
    act(() => {
      root.render(createElement(Consumer, { calls }))
    })
  }
  render(initialCalls)

  return { results, render, unmount: () => act(() => root.unmount()) }
}

const answer = async (request: Deferred | undefined, decodedCalls: (DecodedCall | null)[]) => {
  await act(async () => {
    request!.resolve(decodedCalls)
  })
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('useCallsWithDecodedData', () => {
  it('returns the calls as they are first, then with the decoded data attached', async () => {
    const pendingRequests = holdRequests()
    const calls = [toCall(TRANSFER_DATA), toCall(APPROVE_DATA)]
    const { results, unmount } = renderHook(calls)

    expect(results.at(-1)).toBe(calls)
    expect(requestedCallDatas()).toEqual([[TRANSFER_DATA, APPROVE_DATA]])

    await answer(pendingRequests[0], [TRANSFER_DECODED, APPROVE_DECODED])

    console.log('[decoded calls]', describeCalls(results.at(-1)!))
    expect(results.at(-1)!.map((call) => call.decodedCall)).toEqual([
      TRANSFER_DECODED,
      APPROVE_DECODED
    ])
    expect(results.at(-1)![0]!.fullVisualization).toBe(calls[0]!.fullVisualization)
    unmount()
  })

  it('keeps the decoded data without asking again when new calls have the same data', async () => {
    const pendingRequests = holdRequests()
    const { results, render, unmount } = renderHook([toCall(TRANSFER_DATA)])
    await answer(pendingRequests[0], [TRANSFER_DECODED])

    // Like the plain view being replaced by the ERC-7730 one
    const erc7730Calls = [
      toCall(TRANSFER_DATA, {
        fullVisualization: [{ type: 'label', content: 'ERC-7730 view', id: 2 }]
      })
    ]
    render(erc7730Calls)

    console.log('[after the calls changed]', describeCalls(results.at(-1)!))
    expect(mockDispatchAndWait).toHaveBeenCalledTimes(1)
    expect(results.at(-1)![0]!.decodedCall).toEqual(TRANSFER_DECODED)
    expect(results.at(-1)![0]!.fullVisualization).toBe(erc7730Calls[0]!.fullVisualization)
    unmount()
  })

  it('asks only for the call data it has not asked for yet', async () => {
    const pendingRequests = holdRequests()
    const { results, render, unmount } = renderHook([toCall(TRANSFER_DATA)])
    await answer(pendingRequests[0], [TRANSFER_DECODED])

    render([toCall(TRANSFER_DATA), toCall(APPROVE_DATA), toCall(APPROVE_DATA)])
    console.log('[requests]', JSON.stringify(requestedCallDatas()))
    expect(requestedCallDatas()).toEqual([[TRANSFER_DATA], [APPROVE_DATA]])
    expect(results.at(-1)!.map((call) => call.decodedCall)).toEqual([
      TRANSFER_DECODED,
      undefined,
      undefined
    ])

    await answer(pendingRequests[1], [APPROVE_DECODED])
    console.log('[decoded calls]', describeCalls(results.at(-1)!))
    expect(results.at(-1)!.map((call) => call.decodedCall)).toEqual([
      TRANSFER_DECODED,
      APPROVE_DECODED,
      APPROVE_DECODED
    ])
    unmount()
  })

  it('leaves a call it cannot decode as it is', async () => {
    const pendingRequests = holdRequests()
    const calls = [toCall(UNKNOWN_DATA)]
    const { results, render, unmount } = renderHook(calls)

    await answer(pendingRequests[0], [null])
    render(calls)

    console.log('[decoded calls]', describeCalls(results.at(-1)!))
    expect(results.at(-1)).toBe(calls)
    expect(mockDispatchAndWait).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('reports a failed request, leaves the calls as they are and asks again once the calls change', async () => {
    const pendingRequests = holdRequests()
    const calls = [toCall(TRANSFER_DATA)]
    const { results, render, unmount } = renderHook(calls)
    const error = new Error('The background did not reply')

    await act(async () => {
      pendingRequests[0]!.reject(error)
    })

    expect(captureException).toHaveBeenCalledWith(error)
    expect(results.at(-1)).toBe(calls)

    render([toCall(TRANSFER_DATA)])
    console.log('[requests]', JSON.stringify(requestedCallDatas()))
    expect(requestedCallDatas()).toEqual([[TRANSFER_DATA], [TRANSFER_DATA]])

    await answer(pendingRequests[1], [TRANSFER_DECODED])
    expect(results.at(-1)![0]!.decodedCall).toEqual(TRANSFER_DECODED)
    unmount()
  })
})
