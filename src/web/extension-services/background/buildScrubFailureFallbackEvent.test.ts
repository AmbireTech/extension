import {
  buildScrubFailureFallbackEvent,
  SCRUBBING_FAILED_MESSAGE
} from './buildScrubFailureFallbackEvent'

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
