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

  it('redacts secrets logged to the console and removes the raw logged arguments', () => {
    const breadcrumb = {
      category: CONSOLE_BREADCRUMB_CATEGORY,
      message: `import failed for ${SEED_PHRASE} with key ${PRIVATE_KEY}`,
      data: { arguments: [SEED_PHRASE, PRIVATE_KEY], logger: 'console' }
    }

    const result = filterCrashReportBreadcrumb(breadcrumb)

    expect(result?.message).toContain('[REDACTED_SEED_PHRASE]')
    expect(result?.message).toContain('[REDACTED_PRIVATE_KEY]')
    expect(result?.data).toEqual({ logger: 'console' })
    expect(JSON.stringify(result)).not.toContain('abandon ability')
    expect(JSON.stringify(result)).not.toContain(PRIVATE_KEY)
  })

  it('redacts a seed phrase that straddles the length cut, so no leading words survive it', () => {
    const padding = 'x'.repeat(CONSOLE_BREADCRUMB_MESSAGE_MAX_LENGTH - 20)
    const breadcrumb = {
      category: CONSOLE_BREADCRUMB_CATEGORY,
      message: `${padding} ${SEED_PHRASE}`
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

  it('keeps the content tag a capture site set', () => {
    const result = processMobileCrashReportEvent(
      buildEvent({ content: CRASH_REPORT_CONTENT.CONTROLLERS }),
      new Error('unexpected state'),
      true
    )

    expect(result?.tags).toEqual({ content: CRASH_REPORT_CONTENT.CONTROLLERS })
  })
})
