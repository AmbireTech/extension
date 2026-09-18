/**
 * Decides what happens to a crash report before it leaves the browser.
 *
 * Every Sentry event - controller errors, unhandled rejections, uncaught exceptions and
 * direct `captureException` calls alike - passes through here. Most of what the wallet
 * reports is not a bug: a dapp tab closing, an RPC timing out, a transaction reverting.
 * Left alone, those drown the real bugs, both in volume and in alerts, because messages
 * carrying tab ids or block numbers make Sentry group every single occurrence as a brand
 * new issue.
 */

export const CRASH_REPORT_SEVERITY = {
  DROP: 'drop',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
} as const

export type CrashReportSeverity = (typeof CRASH_REPORT_SEVERITY)[keyof typeof CRASH_REPORT_SEVERITY]

/** The severities that are also valid Sentry `SeverityLevel` values, so they assign to `event.level` as they are. */
export type CrashReportLevel = Exclude<CrashReportSeverity, typeof CRASH_REPORT_SEVERITY.DROP>

/**
 * Sentry's placeholder for "group this the way you normally would". Used for errors no
 * rule recognised, so an unknown bug keeps its own issue instead of being merged away.
 */
export const DEFAULT_SENTRY_GROUPING = '{{ default }}'

/** The flattened error fields the rules match on. Everything is present, even for a non-`Error` throw. */
export type CrashReportErrorDetails = {
  name: string
  message: string
  /** Ethers puts the un-decorated reason here. Some rules deliberately read it instead of `message`. */
  shortMessage: string
  statusCode?: number
  isProviderInvictus?: boolean
  providerUrl?: string
}

export type CrashReportDecision =
  | { shouldSend: false }
  | {
      shouldSend: true
      level: CrashReportLevel
      fingerprint: string[]
    }

type CrashReportRule = {
  /** Stable id. Doubles as the Sentry fingerprint, so renaming one splits its issue history. */
  id: string
  matches: (details: CrashReportErrorDetails) => boolean
  severity: CrashReportSeverity
}

const PROVIDER_ERROR_NAME = 'ProviderError'
const SWAP_AND_BRIDGE_PROVIDER_API_ERROR_NAME = 'SwapAndBridgeProviderApiError'
const RPC_REQUEST_TIMEOUT_MESSAGE = 'request-timeout'
const HTTP_STATUS_OK = 200
const HTTP_STATUS_MULTIPLE_CHOICES = 300

const readString = (value: unknown) => (typeof value === 'string' ? value : '')

/**
 * Flattens whatever was thrown into the fields the rules read.
 */
export const readCrashReportErrorDetails = (error: unknown): CrashReportErrorDetails => {
  if (typeof error === 'string') return { name: '', message: error, shortMessage: '' }

  const source = (error || {}) as Record<string, unknown>

  return {
    name: readString(source.name),
    message: readString(source.message),
    shortMessage: readString(source.shortMessage),
    statusCode: typeof source.statusCode === 'number' ? source.statusCode : undefined,
    isProviderInvictus:
      typeof source.isProviderInvictus === 'boolean' ? source.isProviderInvictus : undefined,
    providerUrl: readString(source.providerUrl) || undefined
  }
}

// Matching is case insensitive because the same underlying failure reaches us with
// different casing depending on the browser and the library that wrapped it.
const includesAny = (text: string, substrings: string[]) => {
  const lowercasedText = text.toLowerCase()

  return substrings.some((substring) => lowercasedText.includes(substring.toLowerCase()))
}

const includes = (text: string, substring: string) => includesAny(text, [substring])

export const isProviderErrorLike = (error: unknown) =>
  readCrashReportErrorDetails(error).name === PROVIDER_ERROR_NAME

/**
 * Whether an RPC answered successfully. Ethers omits the status code on a 2xx, so a
 * missing one counts as a success.
 */
export const isSuccessfulRpcStatusCode = (statusCode?: number) =>
  typeof statusCode !== 'number' ||
  (statusCode >= HTTP_STATUS_OK && statusCode < HTTP_STATUS_MULTIPLE_CHOICES)

const isProviderError = (details: CrashReportErrorDetails) => details.name === PROVIDER_ERROR_NAME

/**
 * Ordered - the first match wins, so the order is important. The constraints that
 * matter are called out in the comments; see SENTRY_NOISE_PLAN.md for the volumes each
 * rule was calibrated against.
 */
const CRASH_REPORT_RULES: CrashReportRule[] = [
  {
    id: 'malformed-value-sent-to-rpc',
    matches: ({ message }) => includes(message, 'invalid BytesLike value'),
    severity: CRASH_REPORT_SEVERITY.WARNING
  },
  {
    id: 'extension-messaging-target-gone',
    matches: ({ message }) =>
      includesAny(message, ['Receiving end does not exist', 'No tab with id', 'No window with id']),
    severity: CRASH_REPORT_SEVERITY.DROP
  },
  {
    id: 'extension-browser-shutting-down',
    matches: ({ message }) => includes(message, 'The browser is shutting down'),
    severity: CRASH_REPORT_SEVERITY.DROP
  },
  {
    id: 'extension-port-bfcached',
    matches: ({ message }) => includes(message, 'moved into back/forward cache'),
    severity: CRASH_REPORT_SEVERITY.DROP
  },
  {
    id: 'extension-message-channel-closed',
    matches: ({ message }) => includes(message, 'message channel closed before a response'),
    severity: CRASH_REPORT_SEVERITY.DROP
  },
  {
    id: 'extension-no-current-window',
    matches: ({ message }) => includes(message, 'No current window'),
    severity: CRASH_REPORT_SEVERITY.DROP
  },
  {
    // The message is literally this and nothing else - no host, no URL, nothing to debug.
    id: 'rpc-request-timeout',
    matches: ({ message }) => message === RPC_REQUEST_TIMEOUT_MESSAGE,
    severity: CRASH_REPORT_SEVERITY.INFO
  },
  {
    id: 'rpc-provider-destroyed',
    matches: ({ message }) => includes(message, 'provider destroyed'),
    severity: CRASH_REPORT_SEVERITY.INFO
  },
  {
    id: 'rpc-missing-revert-data',
    matches: (details) =>
      isProviderError(details) && includes(details.shortMessage, 'missing revert data'),
    severity: CRASH_REPORT_SEVERITY.DROP
  },
  {
    id: 'rpc-custom-non-2xx',
    matches: ({ statusCode, isProviderInvictus }) =>
      typeof statusCode === 'number' &&
      (statusCode < HTTP_STATUS_OK || statusCode >= HTTP_STATUS_MULTIPLE_CHOICES) &&
      isProviderInvictus === false,
    severity: CRASH_REPORT_SEVERITY.DROP
  },
  {
    id: 'rpc-unreachable',
    matches: (details) =>
      isProviderError(details) &&
      includesAny(details.message, ['NetworkError when attempting to fetch', 'Failed to fetch']),
    severity: CRASH_REPORT_SEVERITY.DROP
  },
  {
    id: 'rpc-method-unsupported',
    matches: ({ message }) => includes(message, 'unsupported operation (operation='),
    severity: CRASH_REPORT_SEVERITY.WARNING
  },
  {
    id: 'rpc-malformed-response',
    matches: ({ message }) =>
      includesAny(message, [
        'could not coalesce error',
        'missing response for request',
        'response body is not valid JSON'
      ]),
    severity: CRASH_REPORT_SEVERITY.WARNING
  },
  {
    // Must stay before tx-simulation-failed: the undecodable message starts with the same
    // prefix as the decoded ones, and it means the humanizer has no handler for a revert
    // reason, which is worth knowing about.
    id: 'tx-simulation-undecodable',
    matches: ({ message }) =>
      includes(message, 'Transaction cannot be simulated because of an unknown error'),
    severity: CRASH_REPORT_SEVERITY.WARNING
  },
  {
    id: 'tx-simulation-failed',
    matches: ({ message }) => includes(message, 'Transaction cannot be simulated because'),
    severity: CRASH_REPORT_SEVERITY.WARNING
  },
  {
    id: 'tx-simulation-reverted',
    matches: ({ message }) => includes(message, 'Simulation reverted'),
    severity: CRASH_REPORT_SEVERITY.WARNING
  },
  {
    id: 'tx-execution-reverted',
    matches: ({ message }) => includes(message, 'execution reverted'),
    severity: CRASH_REPORT_SEVERITY.WARNING
  },
  {
    id: 'tx-replacement-fee-too-low',
    matches: ({ message }) => includes(message, 'replacement fee too low'),
    severity: CRASH_REPORT_SEVERITY.INFO
  },
  {
    id: 'tx-insufficient-funds-for-gas',
    matches: ({ message }) =>
      includes(message, 'insufficient funds for intrinsic transaction cost'),
    severity: CRASH_REPORT_SEVERITY.INFO
  },
  {
    id: 'activity-receipt-unavailable',
    matches: ({ message }) => includes(message, 'activity: failed to get transaction receipt'),
    severity: CRASH_REPORT_SEVERITY.WARNING
  },
  {
    id: 'portfolio-activity-block-mismatch',
    matches: ({ message }) => includes(message, 'PORTFOLIO_ACTIVITY_BLOCK_MISMATCH'),
    severity: CRASH_REPORT_SEVERITY.WARNING
  },
  {
    id: 'ui-background-unresponsive',
    matches: ({ message }) =>
      includesAny(message, ['Getting current dapp timed out', 'states loading taking too long']),
    severity: CRASH_REPORT_SEVERITY.ERROR
  },
  {
    id: 'swap-bridge-provider-unavailable',
    matches: ({ name }) => name === SWAP_AND_BRIDGE_PROVIDER_API_ERROR_NAME,
    severity: CRASH_REPORT_SEVERITY.INFO
  },
  {
    id: 'extension-service-worker-unreachable',
    matches: ({ message }) =>
      includesAny(message, ['Failed to connect with the service worker', 'No SW']),
    severity: CRASH_REPORT_SEVERITY.ERROR
  },
  {
    id: 'rpc-websocket-timeout',
    matches: ({ message }) => includes(message, 'websocket_timeout'),
    severity: CRASH_REPORT_SEVERITY.INFO
  },
  {
    id: 'request-aborted',
    matches: ({ message }) =>
      includesAny(message, ['signal is aborted without reason', 'Aborted by timeout']),
    severity: CRASH_REPORT_SEVERITY.DROP
  },
  {
    id: 'extension-tabs-busy',
    matches: ({ message }) => includes(message, 'Tabs cannot be edited right now'),
    severity: CRASH_REPORT_SEVERITY.DROP
  }
]

/**
 * What happens to an error nothing in the table recognised: it is sent, at `error` level,
 * grouped the way Sentry would group it anyway.
 */
export const UNCLASSIFIED_CRASH_REPORT_DECISION: CrashReportDecision = {
  shouldSend: true,
  level: CRASH_REPORT_SEVERITY.ERROR,
  fingerprint: [DEFAULT_SENTRY_GROUPING]
}

/**
 * Decides whether a crash report leaves the browser, how loud it is and which Sentry issue
 * it joins. Returns the first matching rule's config, or the default
 */
export const classifyCrashReport = (error: unknown): CrashReportDecision => {
  const details = readCrashReportErrorDetails(error)
  const rule = CRASH_REPORT_RULES.find(({ matches }) => matches(details))

  if (!rule) return UNCLASSIFIED_CRASH_REPORT_DECISION
  if (rule.severity === CRASH_REPORT_SEVERITY.DROP) return { shouldSend: false }

  return {
    shouldSend: true,
    level: rule.severity,
    fingerprint: [rule.id]
  }
}
