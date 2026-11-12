import { describe, expect, test } from '@jest/globals'

import { getTrezorErrorPayload } from './trezorError'

describe('getTrezorErrorPayload', () => {
  test('preserves a v9 failure payload', () => {
    const payload = { code: 'Failure_ActionCancelled', error: 'Cancelled on device' }

    expect(getTrezorErrorPayload({ payload })).toBe(payload)
  })

  test('maps a v10 failure into the humanizer payload', () => {
    expect(
      getTrezorErrorPayload({
        error: { code: 'Device_Disconnected', message: 'Device disconnected' }
      })
    ).toEqual({ code: 'Device_Disconnected', error: 'Device disconnected' })
  })

  test('preserves a v9 Suite message', () => {
    const payload = { code: 'Method_Cancel', message: 'Permission not granted' }

    expect(getTrezorErrorPayload({ payload })).toBe(payload)
  })

  test('returns an empty payload when a cancellation has no error details', () => {
    expect(getTrezorErrorPayload({})).toEqual({})
  })
})
