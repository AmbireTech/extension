import {
  CONSOLE_BREADCRUMB_CATEGORY,
  CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH,
  CRASH_REPORT_CONTENT,
  TOUCH_BREADCRUMB_CATEGORY
} from '@common/constants/crashAnalytics'

import {
  filterCrashReportBreadcrumb,
  processMobileCrashReportEvent
} from './mobileCrashReportHooks'

const SEED_PHRASE =
  'abandon ability able about above absent absorb abstract absurd abuse access accident'
const PRIVATE_KEY = '0x'.concat('d'.repeat(64))

describe('filterCrashReportBreadcrumb', () => {
  it('drops touch breadcrumbs, which carry the text of the touched element', () => {
    const touchBreadcrumb = {
      category: TOUCH_BREADCRUMB_CATEGORY,
      message: `Touch event within element: ${SEED_PHRASE}`
    }

    expect(filterCrashReportBreadcrumb(touchBreadcrumb)).toBeNull()
  })

  it('drops console breadcrumbs below a warning, so plain logs never reach the scrub', () => {
    const logBreadcrumb = {
      category: CONSOLE_BREADCRUMB_CATEGORY,
      level: 'log' as const,
      message: `import failed for ${SEED_PHRASE}`
    }

    expect(filterCrashReportBreadcrumb(logBreadcrumb)).toBeNull()
  })

  it('redacts secrets logged to the console and removes the raw logged arguments', () => {
    const breadcrumb = {
      category: CONSOLE_BREADCRUMB_CATEGORY,
      level: 'error' as const,
      message: `import failed for ${SEED_PHRASE} with key ${PRIVATE_KEY}`,
      data: { arguments: [SEED_PHRASE, PRIVATE_KEY], logger: 'console' }
    }

    const result = filterCrashReportBreadcrumb(breadcrumb)

    expect(result?.message).toContain('[REDACTED_SEED_PHRASE]')
    expect(result?.message).toContain('[REDACTED_HEX]')
    expect(result?.data).toEqual({ logger: 'console' })
    expect(JSON.stringify(result)).not.toContain('abandon ability')
    expect(JSON.stringify(result)).not.toContain(PRIVATE_KEY)
  })

  it('redacts a seed phrase that straddles the length cut, so no leading words survive it', () => {
    const padding = 'x'.repeat(CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH - 20)
    const breadcrumb = {
      category: CONSOLE_BREADCRUMB_CATEGORY,
      level: 'error' as const,
      message: `${padding} ${SEED_PHRASE}`
    }

    const result = filterCrashReportBreadcrumb(breadcrumb)

    expect(result?.message).not.toContain('abandon')
    expect(result?.message?.length).toBeLessThanOrEqual(CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH)
  })

  it('redacts a 24-word seed phrase that straddles the length cut of a very long message', () => {
    const padding = 'x'.repeat(CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH - 1)
    const tail = 'y'.repeat(100_000)
    const breadcrumb = {
      category: CONSOLE_BREADCRUMB_CATEGORY,
      level: 'error' as const,
      message: `${padding} ${SEED_PHRASE} ${SEED_PHRASE} ${tail}`
    }

    const result = filterCrashReportBreadcrumb(breadcrumb)

    expect(result?.message).not.toContain('abandon')
    expect(result?.message?.length).toBeLessThanOrEqual(CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH)
  })

  it('drops a breadcrumb whose scrub throws, instead of sending it unscrubbed', () => {
    const breadcrumb = {
      category: 'navigation',
      data: {
        get from(): string {
          throw new Error('getter exploded')
        }
      }
    }

    expect(filterCrashReportBreadcrumb(breadcrumb)).toBeNull()
  })
})

describe('processMobileCrashReportEvent', () => {
  const buildEvent = (tags?: Record<string, string>): any => ({
    event_id: 'evt-1',
    message: 'something broke',
    tags
  })

  it('drops every event once the user turned crash reporting off', () => {
    expect(processMobileCrashReportEvent(buildEvent(), new Error('unexpected state'), false)).toBe(
      null
    )
  })

  it('tags an event no capture site tagged as unhandled', () => {
    const result = processMobileCrashReportEvent(buildEvent(), new Error('unexpected state'), true)

    expect(result?.tags).toEqual({ content: CRASH_REPORT_CONTENT.UNHANDLED })
  })

  it('strips the device name, locale and timezone but keeps the rest of the device', () => {
    const event = {
      ...buildEvent(),
      contexts: {
        device: {
          name: "Jane's iPhone",
          locale: 'bg_BG',
          timezone: 'Europe/Sofia',
          model: 'iPhone15'
        },
        culture: { locale: 'bg-BG', timezone: 'Europe/Sofia', calendar: 'GregorianCalendar' }
      }
    }

    const result = processMobileCrashReportEvent(event, new Error('unexpected state'), true)

    expect(result?.contexts).toEqual({
      device: { model: 'iPhone15' },
      culture: { calendar: 'GregorianCalendar' }
    })
  })

  it('strips the id, account traits and details of a report sent while a Privacy Pools account is selected', () => {
    const event = {
      ...buildEvent({ content: CRASH_REPORT_CONTENT.CONTROLLERS, accountType: 'eoa' }),
      user: { id: 'crash-report-id' },
      extra: { controllerName: 'SwapAndBridgeController' },
      exception: { values: [{ type: 'Error', value: 'withdraw to recipient failed' }] }
    }

    const result = processMobileCrashReportEvent(event, new Error('unexpected state'), true, true)

    expect(result).not.toHaveProperty('user')
    expect(result).not.toHaveProperty('message')
    expect(result).not.toHaveProperty('extra')
    expect(result?.tags).toEqual({ content: CRASH_REPORT_CONTENT.CONTROLLERS })
    expect(result?.exception).toEqual({ values: [{ type: 'Error' }] })
  })

  it('keeps the content tag a capture site set', () => {
    const result = processMobileCrashReportEvent(
      buildEvent({ content: CRASH_REPORT_CONTENT.CONTROLLERS }),
      new Error('unexpected state'),
      true
    )

    expect(result?.tags).toEqual({ content: CRASH_REPORT_CONTENT.CONTROLLERS })
  })

  const syntheticStacktrace = { frames: [{ function: 'captureMessage', in_app: true }] }

  it('sends the stack of a message as its thread, so Sentry titles the issue with the message', () => {
    const messageEvent = {
      ...buildEvent(),
      exception: {
        values: [
          {
            value: 'something broke',
            stacktrace: syntheticStacktrace,
            mechanism: { type: 'generic', synthetic: true }
          }
        ]
      }
    }

    const result = processMobileCrashReportEvent(messageEvent, 'something broke', true)

    expect(result?.exception).toBeUndefined()
    expect(result?.message).toBe('something broke')
    expect(result?.threads).toEqual({
      values: [{ current: true, crashed: false, stacktrace: syntheticStacktrace }]
    })
  })

  it('keeps the exception of a captured value that is not an Error', () => {
    const exception = {
      values: [
        {
          type: 'Error',
          value: 'not an error object',
          stacktrace: syntheticStacktrace,
          mechanism: { type: 'generic', synthetic: true }
        }
      ]
    }

    const nonErrorEvent: any = { event_id: 'evt-2', exception }

    const result = processMobileCrashReportEvent(nonErrorEvent, 'not an error object', true)

    expect(result?.exception).toEqual(exception)
    expect(result?.threads).toBeUndefined()
  })
})
