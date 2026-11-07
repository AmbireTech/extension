// The SDK's errors reach the user in plain language, in Ambire's words where
// the SDK's would point elsewhere, and anything unexpected is reported to
// Sentry instead of being shown as technical text.

import { DeviceError, Pq1Error } from 'pq1-sdk'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { captureException } from '@common/config/analytics/CrashAnalytics.web'

import { PQ1_GENERIC_ERROR_MESSAGE, toUserFacingPq1Error } from './errors'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({ captureException: jest.fn() }))

beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.clearAllMocks()
})

describe('toUserFacingPq1Error', () => {
  it("keeps the SDK's plain message for an expected outcome", () => {
    const error = toUserFacingPq1Error(new DeviceError('SIGN: rejected', 0x6982, 'rejected'))
    expect(error).toBeInstanceOf(ExternalSignerError)
    expect(error.message).toBe('The request was rejected on the PQ1.')
    expect(captureException).not.toHaveBeenCalled()
  })

  it("keeps a refusal's own message", () => {
    const refusal = new Pq1Error('too-large', 'call data of 9000 bytes', {
      userMessage: 'This transaction carries more data than a PQ1 can sign.'
    })
    expect(toUserFacingPq1Error(refusal).message).toBe(
      'This transaction carries more data than a PQ1 can sign.'
    )
  })

  it("tells the user where to connect the PQ1 in Ambire when it isn't connected", () => {
    const error = toUserFacingPq1Error(new DeviceError('no device', undefined, 'disconnected'))
    expect(error.message).toContain('choose PQ1 (post-quantum) and press Connect PQ1')
  })

  it('names the browsers that can connect a PQ1, without technical terms', () => {
    const error = toUserFacingPq1Error(new Pq1Error('unsupported', 'WebHID is not available'))
    expect(error.message).toContain('Chrome, Brave or Edge')
    expect(error.message).not.toContain('WebHID')
  })

  it('reports a protocol error and shows the fallback', () => {
    const failure = new DeviceError('unexpected status word 0x6f01')
    const error = toUserFacingPq1Error(failure, 'Sending failed.')
    expect(error.message).toBe('Sending failed.')
    expect(captureException).toHaveBeenCalledWith(failure)
  })

  it('reports anything else and shows the generic message', () => {
    const failure = new TypeError("Cannot read properties of undefined (reading 'x')")
    expect(toUserFacingPq1Error(failure).message).toBe(PQ1_GENERIC_ERROR_MESSAGE)
    expect(captureException).toHaveBeenCalledWith(failure)
  })

  it('passes an already user-facing signer error through', () => {
    const error = new ExternalSignerError('Already worded.')
    expect(toUserFacingPq1Error(error)).toBe(error)
  })
})
