const crashAnalytics = {
  /**
   * Matches the envelope endpoint the Sentry SDK builds from the DSN, e.g.
   * https://sentry.io/api/0000000/envelope/?sentry_key=fake&sentry_version=7
   * The e2e build uses a fake DSN, but the host stays sentry.io so the URL keeps this shape.
   */
  envelopeUrlPattern: '**/sentry.io/api/*/envelope**',
  /** Markers that identify a specific test's error inside an intercepted envelope. */
  uiErrorMarker: 'e2e-crash-analytics-ui-marker',
  backgroundErrorMarker: 'e2e-crash-analytics-background-marker',
  uiCaptureExceptionMarker: 'e2e-crash-analytics-ui-capture-marker',
  backgroundCaptureExceptionMarker: 'e2e-crash-analytics-background-capture-marker',
  consentDisabledMarker: 'e2e-crash-analytics-consent-disabled-marker',
  redactionErrorMarker: 'e2e-crash-analytics-redaction-marker',
  /**
   * A throwaway seed phrase. It has to stay a valid 12-word BIP-39 phrase, otherwise the
   * redaction has nothing to recognize and the test would pass for the wrong reason.
   */
  fakeSeedPhrase: 'test test test test test test test test test test test junk',
  /** A throwaway private key. It has to keep the 32-byte hex shape the redaction looks for. */
  fakePrivateKey: `0x${'deadbeef'.repeat(8)}`,
  /** What scrubSentryEventSecrets (src/common/config/analytics/sentryDataScrubbing.ts) leaves behind. */
  redactedSeedPhrasePlaceholder: '[REDACTED_SEED_PHRASE]',
  redactedPrivateKeyPlaceholder: '[REDACTED_PRIVATE_KEY]',
  /** CRASH_ANALYTICS_ENABLED_STORAGE_KEY in src/common/config/analytics/CrashAnalytics.web.ts. */
  consentStorageKey: 'crashAnalyticsEnabledV2',
  /**
   * The testing-only messages that reach the explicit capture path, both gated on IS_TESTING.
   * The UI one is sent from the background, because runtime messages never come back to the
   * context that sent them.
   */
  uiCaptureExceptionMessageType: 'ambire-extension-test-capture-exception-ui',
  backgroundCaptureExceptionMessageType: 'ambire-extension-test-capture-exception-background',
  /** Sentry initializes asynchronously, so the marker error is re-triggered until a report arrives. */
  deliveryTimeout: 60000,
  retryInterval: 1000,
  /** How long a report gets to show up before "no report was sent" is taken as settled. */
  noReportGracePeriod: 15000
}

export default crashAnalytics
