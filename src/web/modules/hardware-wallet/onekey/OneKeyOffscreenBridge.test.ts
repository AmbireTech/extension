import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

import OneKeyOffscreenBridge from './OneKeyOffscreenBridge'

const sendMessage = jest.fn<(message: unknown) => Promise<unknown>>()
const captureBackgroundException = jest.fn()

jest.mock('@web/constants/browserapi', () => ({
  browser: {
    runtime: {
      getURL: (path: string) => `chrome-extension://ambire/${path}`,
      sendMessage: (message: unknown) => sendMessage(message)
    }
  }
}))
jest.mock('@web/extension-services/background/CrashAnalytics', () => ({
  captureBackgroundException: (error: unknown) => captureBackgroundException(error)
}))

const setChrome = ({ hasOneKeyDocument }: { hasOneKeyDocument: boolean }) => {
  let isCreated = hasOneKeyDocument
  const createDocument = jest.fn(async () => {
    // The browser allows a single offscreen document
    if (isCreated) throw new Error('Only a single offscreen document may be created.')
    await Promise.resolve()
    isCreated = true
  })
  const closeDocument = jest.fn(async () => {
    if (!isCreated) throw new Error('No current offscreen document.')
    isCreated = false
  })
  ;(globalThis as any).chrome = {
    offscreen: { createDocument, closeDocument, hasDocument: jest.fn(async () => isCreated) },
    runtime: { getContexts: jest.fn(async () => (isCreated ? [{}] : [])) }
  }
  return { createDocument, closeDocument }
}

const IDLE_CLOSE_DELAY_MS = 2 * 60 * 1000

describe('OneKeyOffscreenBridge', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    sendMessage.mockReset()
    captureBackgroundException.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('creates the offscreen document once when requests start together', async () => {
    const { createDocument } = setChrome({ hasOneKeyDocument: false })
    sendMessage.mockResolvedValue({ result: { success: true, payload: [] } })
    const bridge = new OneKeyOffscreenBridge()

    await Promise.all([bridge.searchDevices(), bridge.searchDevices(), bridge.cancel()])

    expect(createDocument).toHaveBeenCalledTimes(1)
  })

  test('reports an error thrown in the offscreen document and rethrows it', async () => {
    setChrome({ hasOneKeyDocument: true })
    sendMessage.mockResolvedValue({
      error: { message: 'Something broke', name: 'TypeError', stack: 'TypeError: stack' }
    })
    const bridge = new OneKeyOffscreenBridge()

    await expect(bridge.searchDevices()).rejects.toThrow('Something broke')
    expect(captureBackgroundException).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'TypeError', stack: 'TypeError: stack' })
    )
  })

  test('explains in plain words when the offscreen document does not answer', async () => {
    setChrome({ hasOneKeyDocument: true })
    sendMessage.mockResolvedValue(undefined)
    const bridge = new OneKeyOffscreenBridge()

    await expect(bridge.searchDevices()).rejects.toThrow(
      "Ambire couldn't reach your OneKey. Reconnect it and try again."
    )
    expect(captureBackgroundException).toHaveBeenCalledTimes(1)
  })

  test('closes the document once OneKey is idle and tells the controller', async () => {
    const { closeDocument } = setChrome({ hasOneKeyDocument: false })
    sendMessage.mockResolvedValue({ result: { success: true, payload: [] } })
    const onDocumentClosed = jest.fn()
    const bridge = new OneKeyOffscreenBridge({ onDocumentClosed })

    await bridge.searchDevices()
    await jest.advanceTimersByTimeAsync(IDLE_CLOSE_DELAY_MS - 1)
    expect(closeDocument).not.toHaveBeenCalled()

    await jest.advanceTimersByTimeAsync(1)
    expect(closeDocument).toHaveBeenCalledTimes(1)
    expect(onDocumentClosed).toHaveBeenCalledTimes(1)
  })

  test('keeps the document open while a request is waiting on the device', async () => {
    const { closeDocument } = setChrome({ hasOneKeyDocument: false })
    let answerRequest: (response: unknown) => void = () => {}
    sendMessage.mockReturnValue(
      new Promise((resolve) => {
        answerRequest = resolve
      })
    )
    const bridge = new OneKeyOffscreenBridge()

    const signing = bridge.evmSignMessage('connect-id', 'device-id', {})
    await jest.advanceTimersByTimeAsync(IDLE_CLOSE_DELAY_MS * 2)
    expect(closeDocument).not.toHaveBeenCalled()

    answerRequest({ result: { success: true, payload: { address: '0x', signature: '0x' } } })
    await signing
    await jest.advanceTimersByTimeAsync(IDLE_CLOSE_DELAY_MS)
    expect(closeDocument).toHaveBeenCalledTimes(1)
  })

  test('opens the document again for a request after it was closed', async () => {
    const { createDocument } = setChrome({ hasOneKeyDocument: false })
    sendMessage.mockResolvedValue({ result: { success: true, payload: [] } })
    const bridge = new OneKeyOffscreenBridge()

    await bridge.searchDevices()
    await jest.advanceTimersByTimeAsync(IDLE_CLOSE_DELAY_MS)
    await bridge.searchDevices()

    expect(createDocument).toHaveBeenCalledTimes(2)
  })

  test('closes a document left open from before the background restarted', async () => {
    const { closeDocument } = setChrome({ hasOneKeyDocument: true })

    new OneKeyOffscreenBridge()

    await jest.advanceTimersByTimeAsync(IDLE_CLOSE_DELAY_MS)
    expect(closeDocument).toHaveBeenCalledTimes(1)
  })

  test('does not open the document just to cancel', async () => {
    const { createDocument } = setChrome({ hasOneKeyDocument: false })
    const bridge = new OneKeyOffscreenBridge()

    await bridge.cancel('connect-id')

    expect(createDocument).not.toHaveBeenCalled()
    expect(sendMessage).not.toHaveBeenCalled()
  })
})
