import * as Sentry from '@sentry/browser'

export const SCRUBBING_FAILED_MESSAGE = '[SCRUBBING_FAILED]'

/**
 * Scrubbing itself threw, so nothing in `event` can be trusted anymore -- it may
 * be only partially processed and still contain secrets. This discards it
 * entirely and returns a minimal, clearly-marked placeholder instead, carrying
 * only the scrubbing error's own message/stack (safe: that's a JS runtime error
 * about the scrubbing code's internal state, not user data) so we both know this
 * happened and can see why, without ever risking sending an unscrubbed secret.
 *
 * Generic (returns T, the same specific event type passed in) rather than typed
 * as the general Sentry.Event, so it stays assignable to a `beforeSend` return
 * position, which requires the narrower ErrorEvent, not the broader Event union.
 * The object literal only sets a subset of T's fields, which is fine at runtime
 * (Sentry only needs these), so the cast to T is a deliberate, narrow escape hatch.
 */
export const buildScrubFailureFallbackEvent = <T extends Sentry.Event>(
  event: T,
  scrubError: unknown
): T =>
  ({
    event_id: event.event_id,
    timestamp: event.timestamp,
    level: event.level,
    environment: event.environment,
    release: event.release,
    message: SCRUBBING_FAILED_MESSAGE,
    extra: {
      scrubErrorMessage: scrubError instanceof Error ? scrubError.message : String(scrubError),
      scrubErrorStack: scrubError instanceof Error ? scrubError.stack : undefined
    }
  }) as unknown as T
