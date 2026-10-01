import { beforeEach, describe, expect, jest, test } from '@jest/globals'

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
    await new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
    isCreated = true
  })
  ;(globalThis as any).chrome = {
    offscreen: { createDocument, hasDocument: jest.fn(async () => isCreated) },
    runtime: { getContexts: jest.fn(async () => (isCreated ? [{}] : [])) }
  }
  return { createDocument }
}

describe('OneKeyOffscreenBridge', () => {
  beforeEach(() => {
    sendMessage.mockReset()
    captureBackgroundException.mockReset()
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
})
