import {
  classifyCrashReport,
  CRASH_REPORT_SEVERITY,
  DEFAULT_SENTRY_GROUPING,
  isProviderErrorLike,
  isSuccessfulRpcStatusCode
} from './crashReportPolicy'

/** Builds a thrown value shaped the way the real error reaches `beforeSend`. */
const buildError = (
  message: string,
  extra: {
    name?: string
    shortMessage?: string
    statusCode?: number
    isProviderInvictus?: boolean
  } = {}
) => Object.assign(new Error(message), extra)

const providerError = (message: string, extra: Record<string, unknown> = {}) =>
  buildError(message, { name: 'ProviderError', ...extra })

describe('classifyCrashReport', () => {
  // A dropped event leaves no trace anywhere, so an over-broad drop rule is invisible
  // until somebody notices an absence. These are the only guard against that.
  describe('negative cases - neighbouring errors a drop rule must not swallow', () => {
    it.each([
      ['Failed to establish a connection with the relayer'],
      ['The bundler is shutting down.'],
      ['The page keeping the extension port was closed'],
      ['A listener indicated an asynchronous response by returning true'],
      ['No current account selected'],
      ['request-timeout for https://invictus.ambire.com/ethereum'],
      ['provider is being replaced'],
      ['Simulation succeeded'],
      ['replacement transaction underpriced'],
      ['insufficient funds for gas * price + value'],
      ['The user aborted a request.'],
      ['Tabs cannot be created right now']
    ])('keeps "%s"', (message) => {
      expect(classifyCrashReport(buildError(message))).toEqual({
        shouldSend: true,
        level: CRASH_REPORT_SEVERITY.ERROR,
        fingerprint: [DEFAULT_SENTRY_GROUPING]
      })
    })

    it('does not drop a missing-revert-data message that is only in `message`', () => {
      // The rule deliberately reads shortMessage, the way the background rule it replaces did
      const error = providerError('missing revert data while calling the contract')

      expect(classifyCrashReport(error).shouldSend).toBe(true)
    })

    it('does not drop a non-2xx status code coming from an Invictus RPC', () => {
      const error = buildError('Bad gateway', { statusCode: 502, isProviderInvictus: true })

      expect(classifyCrashReport(error).shouldSend).toBe(true)
    })

    it('does not drop a fetch failure that is not a ProviderError', () => {
      expect(classifyCrashReport(buildError('Failed to fetch')).shouldSend).toBe(true)
    })
  })

  describe('rule ordering', () => {
    // `invalid BytesLike value` is a ProviderError like
    // the rules below it, but it means our own code passed a malformed value to an RPC.
    it('keeps alerting on a malformed value even when it looks like a droppable ProviderError', () => {
      const error = providerError('invalid BytesLike value (value="0x0")', {
        statusCode: 502,
        isProviderInvictus: false,
        shortMessage: 'missing revert data'
      })

      // Asserting the fingerprint rather than the level, because the level is a tuning knob
      // and the ordering is what this test is about
      const decision = classifyCrashReport(error)

      expect(decision.shouldSend && decision.fingerprint).toEqual(['malformed-value-sent-to-rpc'])
    })

    it('files an undecodable simulation as its own issue, not with the decoded ones', () => {
      const undecodable = classifyCrashReport(
        buildError(
          'Transaction cannot be simulated because of an unknown error. Error code: 0x08c379a0'
        )
      )
      const decoded = classifyCrashReport(
        buildError('Transaction cannot be simulated because the slippage tolerance was exceeded.')
      )

      expect(undecodable.shouldSend && undecodable.fingerprint).toEqual([
        'tx-simulation-undecodable'
      ])
      expect(decoded.shouldSend && decoded.fingerprint).toEqual(['tx-simulation-failed'])
    })
  })

  // Overriding the fingerprint is the whole point of a matched rule. Sentry's own grouping
  // splits on the varying part of the message (e.g., an unique tab id makes it a unique issue).
  it('gives every occurrence of a rule the same fingerprint, whatever varies in the message', () => {
    const first = classifyCrashReport(
      buildError('activity: failed to get transaction receipt for 0xaaa')
    )
    const second = classifyCrashReport(
      buildError('activity: failed to get transaction receipt for 0xbbb')
    )

    expect(first).toEqual(second)
    expect(first.shouldSend && first.fingerprint).toEqual(['activity-receipt-unavailable'])
  })

  describe('the unclassified default', () => {
    it.each([
      [
        'a real code bug',
        buildError("Cannot read properties of undefined (reading 'toLowerCase')")
      ],
      ['an error nobody has looked at yet', buildError('something entirely new broke')]
    ])('keeps %s at error level with Sentry grouping', (_, error) => {
      expect(classifyCrashReport(error)).toEqual({
        shouldSend: true,
        level: CRASH_REPORT_SEVERITY.ERROR,
        fingerprint: [DEFAULT_SENTRY_GROUPING]
      })
    })

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['a number', 42],
      ['a plain object', { code: -32000 }],
      ['an empty string', '']
    ])('does not throw on %s', (_, thrown) => {
      expect(() => classifyCrashReport(thrown)).not.toThrow()
      expect(classifyCrashReport(thrown).shouldSend).toBe(true)
    })

    it('classifies a thrown string by its text', () => {
      const decision = classifyCrashReport('request-timeout')

      expect(decision.shouldSend && decision.fingerprint).toEqual(['rpc-request-timeout'])
    })
  })

  // The crash-analytics e2e suite asserts these are delivered, so no rule may match them
  describe('e2e markers', () => {
    it.each([
      ['e2e-crash-analytics-ui-marker'],
      ['e2e-crash-analytics-background-marker'],
      ['e2e-crash-analytics-ui-capture-marker'],
      ['e2e-crash-analytics-background-capture-marker'],
      ['e2e-crash-analytics-consent-disabled-marker'],
      ['e2e-crash-analytics-redaction-marker']
    ])('delivers "%s"', (marker) => {
      expect(classifyCrashReport(buildError(marker)).shouldSend).toBe(true)
    })
  })
})

describe('isProviderErrorLike', () => {
  it('matches by name, so it survives a serialized ProviderError', () => {
    expect(isProviderErrorLike({ name: 'ProviderError', message: 'execution reverted' })).toBe(true)
  })

  it('does not match a plain error carrying the same message', () => {
    expect(isProviderErrorLike(buildError('execution reverted'))).toBe(false)
  })

  it('does not throw on a non-object', () => {
    expect(isProviderErrorLike(undefined)).toBe(false)
  })
})

describe('isSuccessfulRpcStatusCode', () => {
  it.each([[200], [204], [299], [undefined]])('treats %s as a success', (statusCode) => {
    expect(isSuccessfulRpcStatusCode(statusCode)).toBe(true)
  })

  it.each([[199], [300], [429], [502]])('treats %s as a failure', (statusCode) => {
    expect(isSuccessfulRpcStatusCode(statusCode)).toBe(false)
  })
})
