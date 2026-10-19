// `toUserFacingPq1Error` is the only place PQ1 errors become user-facing
// text, so every branch is pinned here: expected outcomes get a plain
// message and stay out of Sentry, anything else gets the fallback message
// and IS reported, and no technical detail (status words, protocol names)
// leaks into what the user sees.

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { captureException } from '@common/config/analytics/CrashAnalytics.web'

import { isPq1Error, PQ1_GENERIC_ERROR_MESSAGE, Pq1UserError, toUserFacingPq1Error } from './errors'
import { DeviceError, type DeviceErrorCode } from './transport/hid'

jest.mock('@common/config/analytics/CrashAnalytics.web', () => ({
  captureException: jest.fn()
}))

const captureExceptionMock = captureException as jest.Mock

describe('toUserFacingPq1Error', () => {
  beforeEach(() => {
    captureExceptionMock.mockClear()
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('passes an ExternalSignerError through unchanged', () => {
    const original = new ExternalSignerError('Already plain.')
    expect(toUserFacingPq1Error(original)).toBe(original)
    expect(captureExceptionMock).not.toHaveBeenCalled()
  })

  it('keeps the message of a Pq1UserError and leaves the technical detail out', () => {
    const result = toUserFacingPq1Error(
      new Pq1UserError('Plain reason.', 'Safe sign / exec parse fail (operation=1)')
    )
    expect(result).toBeInstanceOf(ExternalSignerError)
    expect(result.message).toBe('Plain reason.')
    expect(captureExceptionMock).not.toHaveBeenCalled()
  })

  const codes: DeviceErrorCode[] = [
    'disconnected',
    'locked',
    'rejected',
    'timeout',
    'refused',
    'outdated',
    'sign-refused',
    'unsupported'
  ]
  it.each(codes)('maps a %s DeviceError to a plain message without reporting it', (code) => {
    const result = toUserFacingPq1Error(
      new DeviceError('SIGN_USEROP failed: SW=0x6985', 0x6985, code)
    )
    expect(result.message).not.toContain('SW=')
    expect(result.message).not.toContain('SIGN_USEROP')
    expect(result.message).not.toBe(PQ1_GENERIC_ERROR_MESSAGE)
    expect(captureExceptionMock).not.toHaveBeenCalled()
  })

  it('hides an uncoded DeviceError behind the generic message and reports it', () => {
    const error = new DeviceError('HID sequence mismatch: expected 1, got 3')
    const result = toUserFacingPq1Error(error)
    expect(result.message).toBe(PQ1_GENERIC_ERROR_MESSAGE)
    expect(captureExceptionMock).toHaveBeenCalledWith(error)
  })

  it('uses the caller-provided fallback for unexpected errors', () => {
    const error = new Error('sign response truncated (type2)')
    const result = toUserFacingPq1Error(error, 'Custom fallback.')
    expect(result.message).toBe('Custom fallback.')
    expect(captureExceptionMock).toHaveBeenCalledWith(error)
  })

  it.each([
    [new DeviceError('x', undefined, 'locked'), true],
    [new Pq1UserError('Plain reason.'), true],
    [new ExternalSignerError('Already plain.'), true],
    [new Error("AA21 didn't pay prefund"), false]
  ])('tells PQ1 errors from the rest (%#)', (error, expected) => {
    expect(isPq1Error(error)).toBe(expected)
  })

  it('handles non-Error throwables', () => {
    const result = toUserFacingPq1Error('boom')
    expect(result.message).toBe(PQ1_GENERIC_ERROR_MESSAGE)
    expect(captureExceptionMock).toHaveBeenCalledWith('boom')
  })
})
