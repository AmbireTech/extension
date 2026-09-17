import crashAnalytics from 'constants/crashAnalytics'
import mainConstants from 'constants/mainConstants'
import selectors from 'constants/selectors'

import { BrowserContext, expect, Page, test, Worker } from '@playwright/test'

import { bootstrapWithStorage } from '../../common-helpers/bootstrap'

/**
 * Proves that a crash report actually leaves the extension, carries no secrets, and stays put
 * when the user opted out.
 */
test.describe('crash analytics', { tag: '@crashAnalytics' }, () => {
  test.setTimeout(180000)

  let context: BrowserContext
  let page: Page
  let serviceWorker: Worker
  let interceptedEnvelopes: string[]

  /**
   * Launches the extension with crash reporting on or off, intercepts every Sentry envelope
   * into `interceptedEnvelopes`, and leaves the UI open and ready.
   */
  const startExtension = async (isCrashReportingEnabled = true) => {
    const bootstrapped = await bootstrapWithStorage(
      'crash-analytics',
      { [crashAnalytics.consentStorageKey]: JSON.stringify(isCrashReportingEnabled) },
      true
    )

    context = bootstrapped.context
    page = bootstrapped.page
    serviceWorker = bootstrapped.serviceWorker
    interceptedEnvelopes = []

    await context.route(crashAnalytics.envelopeUrlPattern, async (route) => {
      const body = route.request().postData()
      if (body) interceptedEnvelopes.push(body)

      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    })

    await page.goto(`${bootstrapped.extensionURL}${mainConstants.urls.getStarted}`, {
      waitUntil: 'load'
    })
    // Waiting for a rendered screen means the UI has its controller state, which in turn means
    // the background's controllers finished loading - including the one holding the consent.
    await expect(page.getByTestId(selectors.getStarted.createNewAccountButton)).toBeVisible()
  }

  test.afterEach(async () => {
    await context.close()
  })

  /**
   * Throws an uncaught error in the given page or service worker. The throw happens inside a
   * timeout so it escapes `evaluate` and reaches the real global error handler
   */
  const throwUncaughtErrorIn = (target: Page | Worker, message: string) =>
    (target as Page).evaluate((thrownMessage: string) => {
      setTimeout(() => {
        throw new Error(thrownMessage)
      })
    }, message)

  /**
   * Reports through the UI's exported `captureException`, the way most of the app reports.
   */
  const captureExceptionInUi = (message: string) =>
    serviceWorker.evaluate(
      ([type, errorMessage]) => chrome.runtime.sendMessage({ type, errorMessage }),
      [crashAnalytics.uiCaptureExceptionMessageType, message]
    )

  /** Reports through the background's `captureBackgroundException`, the way controllers report. */
  const captureExceptionInBackground = (message: string) =>
    page.evaluate(
      ([type, errorMessage]) => chrome.runtime.sendMessage({ type, errorMessage }),
      [crashAnalytics.backgroundCaptureExceptionMessageType, message]
    )

  /**
   * Re-triggers `report` until an envelope carrying the marker is intercepted, and returns
   * that envelope. Each attempt gets a unique message, because Sentry's dedupe integration
   * drops an error it has already seen and a repeat would never produce a second report.
   */
  const expectCrashReportFor = async (
    marker: string,
    report: (message: string) => Promise<unknown>,
    buildMessage: (uniqueMarker: string) => string = (uniqueMarker) => uniqueMarker
  ) => {
    let attempt = 0
    let matchingEnvelope: string | undefined

    await expect
      .poll(
        async () => {
          attempt += 1
          await report(buildMessage(`${marker}-attempt-${attempt}`))

          matchingEnvelope = interceptedEnvelopes.find((envelope) => envelope.includes(marker))

          return !!matchingEnvelope
        },
        {
          timeout: crashAnalytics.deliveryTimeout,
          intervals: [crashAnalytics.retryInterval],
          message: [
            `No Sentry envelope containing "${marker}" was intercepted.`,
            'Either crash reporting is broken (check the LavaMoat policy for @sentry/react>@sentry/core',
            'and the transport in src/common/config/analytics/CrashAnalytics.web.ts), or the build',
            'was made without SENTRY_DSN_BROWSER_EXTENSION.'
          ].join(' ')
        }
      )
      .toBe(true)

    return matchingEnvelope as string
  }

  /**
   * An error message carrying a fake seed phrase and a fake private key, shaped the way a
   * careless log line or a rethrown error would carry them.
   */
  const buildMessageWithSecrets = (uniqueMarker: string) =>
    `${uniqueMarker} | mnemonic: "${crashAnalytics.fakeSeedPhrase}" | privateKey: "${crashAnalytics.fakePrivateKey}"`

  const expectSecretsRedactedIn = (envelope: string) => {
    expect(envelope).not.toContain(crashAnalytics.fakeSeedPhrase)
    expect(envelope).not.toContain(crashAnalytics.fakePrivateKey)
    expect(envelope).toContain(crashAnalytics.redactedSeedPhrasePlaceholder)
    expect(envelope).toContain(crashAnalytics.redactedPrivateKeyPlaceholder)
  }

  test('an uncaught error in the extension UI is reported to Sentry', async () => {
    await startExtension()

    await expectCrashReportFor(crashAnalytics.uiErrorMarker, (message) =>
      throwUncaughtErrorIn(page, message)
    )
  })

  test('an uncaught error in the background is reported to Sentry', async () => {
    await startExtension()

    await expectCrashReportFor(crashAnalytics.backgroundErrorMarker, (message) =>
      throwUncaughtErrorIn(serviceWorker, message)
    )
  })

  test('an error captured explicitly in the extension UI is reported to Sentry', async () => {
    await startExtension()

    await expectCrashReportFor(crashAnalytics.uiCaptureExceptionMarker, captureExceptionInUi)
  })

  test('an error captured explicitly in the background is reported to Sentry', async () => {
    await startExtension()

    await expectCrashReportFor(
      crashAnalytics.backgroundCaptureExceptionMarker,
      captureExceptionInBackground
    )
  })

  // The UI and the background each build their own `beforeSend`, so the scrubbing is wired up
  // twice and has to be checked twice. This asserts on the bytes actually leaving the
  // extension, which is what sentryDataScrubbing.test.ts (a unit test of the rules) cannot do.
  test('a crash report from the extension UI carries no seed phrase or private key', async () => {
    await startExtension()

    const envelope = await expectCrashReportFor(
      crashAnalytics.redactionErrorMarker,
      (message) => throwUncaughtErrorIn(page, message),
      buildMessageWithSecrets
    )

    expectSecretsRedactedIn(envelope)
  })

  test('a crash report from the background carries no seed phrase or private key', async () => {
    await startExtension()

    const envelope = await expectCrashReportFor(
      crashAnalytics.redactionErrorMarker,
      (message) => throwUncaughtErrorIn(serviceWorker, message),
      buildMessageWithSecrets
    )

    expectSecretsRedactedIn(envelope)
  })

  // A test that asserts nothing arrives would also pass if reporting were broken outright, so
  // it only means something next to the tests above, which fail in exactly that case.
  test('nothing is reported to Sentry once the user turns crash reporting off', async () => {
    await startExtension(false)

    const marker = crashAnalytics.consentDisabledMarker

    await throwUncaughtErrorIn(page, `${marker}-ui`)
    await throwUncaughtErrorIn(serviceWorker, `${marker}-background`)
    await captureExceptionInUi(`${marker}-ui-captured`)
    await captureExceptionInBackground(`${marker}-background-captured`)

    await page.waitForTimeout(crashAnalytics.noReportGracePeriod)

    expect(interceptedEnvelopes.filter((envelope) => envelope.includes(marker))).toEqual([])
  })
})
