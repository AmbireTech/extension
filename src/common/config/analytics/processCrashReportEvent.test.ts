import {
  buildScrubFailureFallbackEvent,
  isJsonSyntaxError,
  processCrashReportEvent,
  SCRUBBING_FAILED_MESSAGE
} from './processCrashReportEvent'

const PRIVATE_KEY = '0x'.concat('c'.repeat(64))
const INVICTUS_URL = 'https://invictus.ambire.com/ethereum'
const HTTP_STATUS_BAD_GATEWAY = 502

/** An event as the SDK hands it to `beforeSend`, carrying every field the pipeline may strip. */
const buildEvent = (): any => ({
  event_id: 'evt-1',
  message: 'something broke',
  user: { id: 'anonymous-app-id' },
  extra: { controllerName: 'MainController' },
  contexts: { app: { app_version: '1.0.0' } },
  tags: { content: 'controllers' },
  breadcrumbs: [{ category: 'console', message: 'loading portfolio' }]
})

describe('processCrashReportEvent', () => {
  it('scrubs a secret anywhere in the event', () => {
    const event = buildEvent()
    event.breadcrumbs.push({ category: 'console', message: `signing with ${PRIVATE_KEY}` })

    const result = processCrashReportEvent(event, new Error('unexpected state'))

    expect(JSON.stringify(result)).not.toContain(PRIVATE_KEY)
    expect(result.breadcrumbs[1].message).toContain('[REDACTED_PRIVATE_KEY]')
  })

  it('strips breadcrumbs, user, extra and contexts from a non-2xx provider error and tags the provider', () => {
    const error = Object.assign(new Error('Bad gateway'), {
      name: 'ProviderError',
      statusCode: HTTP_STATUS_BAD_GATEWAY,
      isProviderInvictus: true,
      providerUrl: INVICTUS_URL
    })

    const result = processCrashReportEvent(buildEvent(), error)

    expect(result).not.toBeNull()
    expect(result.breadcrumbs).toBeUndefined()
    expect(result.user).toBeUndefined()
    expect(result.contexts).toBeUndefined()
    expect(result.extra).toEqual({ providerUrl: INVICTUS_URL })
    expect(result.tags).toEqual({
      content: 'controllers',
      providerUrl: INVICTUS_URL,
      providerType: 'invictus'
    })
  })

  it('keeps the fingerprint the capture site set unless a policy rule claims the error', () => {
    const captureFingerprint = ['webview', 'MainController', 'worker failed']

    const unclassified = processCrashReportEvent(
      { ...buildEvent(), fingerprint: captureFingerprint },
      new Error('worker failed')
    )
    const matchedByRule = processCrashReportEvent(
      { ...buildEvent(), fingerprint: captureFingerprint },
      new Error('invalid BytesLike value')
    )

    expect(unclassified.fingerprint).toEqual(captureFingerprint)
    expect(matchedByRule.fingerprint).toEqual(['malformed-value-sent-to-rpc'])
  })

  it('keeps the fatal level of an app crash, and still applies the policy level otherwise', () => {
    const crash = processCrashReportEvent(
      { ...buildEvent(), level: 'fatal' },
      new Error('invalid BytesLike value')
    )
    const handled = processCrashReportEvent(
      { ...buildEvent(), level: 'error' },
      new Error('invalid BytesLike value')
    )

    expect(crash.level).toBe('fatal')
    expect(handled.level).toBe('warning')
  })

  it('sends only the marked fallback event when scrubbing throws, never the unscrubbed content', () => {
    const event = buildEvent()
    Object.defineProperty(event.extra, 'unreadable', {
      enumerable: true,
      get: () => {
        throw new Error('getter exploded')
      }
    })
    event.message = `failed with ${PRIVATE_KEY}`

    const result = processCrashReportEvent(event, new Error('unexpected state'))

    expect(result.message).toBe(SCRUBBING_FAILED_MESSAGE)
    expect(result.extra).toEqual({
      scrubErrorMessage: 'getter exploded',
      scrubErrorStack: expect.any(String)
    })
    expect(result.breadcrumbs).toBeUndefined()
    expect(JSON.stringify(result)).not.toContain(PRIVATE_KEY)
  })
})

describe('buildScrubFailureFallbackEvent', () => {
  const originalEvent: any = {
    event_id: 'evt-1',
    timestamp: 123456,
    level: 'error',
    environment: 'production',
    release: 'extension-webkit@1.0.0',
    message: 'privateKey=0x'.concat('a'.repeat(64)),
    extra: { password: 'SuperSecretPassword123!' },
    contexts: { some: 'context' },
    breadcrumbs: [{ message: 'did something' }]
  }

  it('replaces the message with the fixed scrubbing-failed marker', () => {
    const result = buildScrubFailureFallbackEvent(originalEvent, new Error('boom'))

    expect(result.message).toBe(SCRUBBING_FAILED_MESSAGE)
  })

  it('preserves only safe, non-content metadata from the original event', () => {
    const result = buildScrubFailureFallbackEvent(originalEvent, new Error('boom'))

    expect(result.event_id).toBe('evt-1')
    expect(result.timestamp).toBe(123456)
    expect(result.level).toBe('error')
    expect(result.environment).toBe('production')
    expect(result.release).toBe('extension-webkit@1.0.0')
  })

  it('drops all original content that could carry a secret', () => {
    const result: any = buildScrubFailureFallbackEvent(originalEvent, new Error('boom'))

    expect(result.contexts).toBeUndefined()
    expect(result.breadcrumbs).toBeUndefined()
    expect(JSON.stringify(result)).not.toContain('SuperSecretPassword123!')
    expect(JSON.stringify(result)).not.toContain('a'.repeat(64))
  })

  it('includes the scrubbing error message and stack for debugging', () => {
    const scrubError = new Error('Cannot read properties of undefined')

    const result = buildScrubFailureFallbackEvent(originalEvent, scrubError)

    expect(result.extra?.scrubErrorMessage).toBe('Cannot read properties of undefined')
    expect(result.extra?.scrubErrorStack).toBe(scrubError.stack)
  })

  it('handles a non-Error thrown value gracefully', () => {
    const result = buildScrubFailureFallbackEvent(originalEvent, 'a thrown string, not an Error')

    expect(result.extra?.scrubErrorMessage).toBe('a thrown string, not an Error')
    expect(result.extra?.scrubErrorStack).toBeUndefined()
  })
})

describe('isJsonSyntaxError', () => {
  it('matches a failed JSON parse of an HTML page, but not other syntax errors', () => {
    let jsonError: unknown
    try {
      JSON.parse('<!DOCTYPE html><html></html>')
    } catch (error) {
      jsonError = error
    }

    let bigIntError: unknown
    try {
      BigInt('not a number')
    } catch (error) {
      bigIntError = error
    }

    expect(isJsonSyntaxError(jsonError)).toBe(true)
    expect(isJsonSyntaxError(bigIntError)).toBe(false)
  })

  it("matches the wording Hermes uses on mobile, which V8 doesn't produce", () => {
    const hermesJsonError = new SyntaxError('JSON Parse error: Unexpected character: <')

    expect(isJsonSyntaxError(hermesJsonError)).toBe(true)
  })
})
