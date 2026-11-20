import tokens from 'constants/tokens'
import { formatUnits } from 'ethers'
import { appendFileSync } from 'fs'

const RELAYER_E2E_BALANCE_URL = 'https://relayer.ambire.com/v2/e2eBalance'
const RELAYER_REQUEST_TIMEOUT_MS = 15 * 1000

const GAS_TANK_CHAIN = 'gasTank'
const NATIVE_TOKEN = 'native'
const GAS_TANK_DECIMALS = 6
const NATIVE_TOKEN_DECIMALS = 18
const ERC20_DECIMALS_BY_SYMBOL: Record<string, number> = {
  USDC: 6,
  DAI: 18,
  WALLET: 18
}

/**
 * A balance below `minValue * LOW_BALANCE_MULTIPLIER` is reported as running low.
 * It does not fail the run, it only gives us time to top up before the hard minimum is hit.
 */
export const LOW_BALANCE_MULTIPLIER = 5n

/** A single token entry, exactly as returned by the relayer `/v2/e2eBalance/:addr` endpoint. */
export type RelayerTokenBalance = {
  chain: string
  addr: string
  token: string
  minValue: string
  currentBalance: string
  insufficient: boolean
}

/**
 * - `ok` - enough funds
 * - `low` - above the hard minimum, but below the early-warning level
 * - `insufficient` - below the hard minimum, the tests using this token are going to fail
 */
export type BalanceStatus = 'ok' | 'low' | 'insufficient'

/** A relayer token entry, classified and formatted for humans. */
export type TokenBalanceReport = {
  /** Human-readable token name, e.g. `base USDC` or `Gas Tank` */
  label: string
  status: BalanceStatus
  current: string
  min: string
  /** The balance below which the token is reported as running low */
  lowLevel: string
  /** How much has to be sent to get back above the low level. `0` when the status is `ok` */
  topUp: string
}

type TokenMetadata = { symbol: string; decimals: number }

const knownErc20Tokens = Object.values(tokens).flatMap((tokenByNetwork) =>
  Object.values(tokenByNetwork)
)

const getNativeTokenMetadata = (chain: string): TokenMetadata => {
  if (chain === GAS_TANK_CHAIN) return { symbol: '', decimals: GAS_TANK_DECIMALS }

  return { symbol: tokens.eth[chain]?.symbol ?? NATIVE_TOKEN, decimals: NATIVE_TOKEN_DECIMALS }
}

const getTokenMetadata = (chain: string, token: string): TokenMetadata | undefined => {
  if (token === NATIVE_TOKEN) return getNativeTokenMetadata(chain)

  const knownToken = knownErc20Tokens.find(
    ({ address, chainName }) => chainName === chain && address.toLowerCase() === token.toLowerCase()
  )
  if (!knownToken) return undefined

  const decimals = ERC20_DECIMALS_BY_SYMBOL[knownToken.symbol]
  if (decimals === undefined) return undefined

  return { symbol: knownToken.symbol, decimals }
}

const getTokenLabel = (chain: string, token: string, metadata?: TokenMetadata) => {
  if (chain === GAS_TANK_CHAIN) return 'Gas Tank'
  // An unknown token - add it to `constants/tokens.ts` and `ERC20_DECIMALS_BY_SYMBOL`
  if (!metadata) return `${chain} ${token}`

  return `${chain} ${metadata.symbol}`
}

const formatAmount = (raw: bigint, metadata?: TokenMetadata) => {
  if (!metadata) return `${raw.toString()} (raw units)`

  return formatUnits(raw, metadata.decimals)
}

const getBalanceStatus = (current: bigint, min: bigint, lowLevel: bigint): BalanceStatus => {
  if (current < min) return 'insufficient'
  if (current < lowLevel) return 'low'

  return 'ok'
}

/**
 * Classifies a relayer token entry as `ok`, `low` or `insufficient` and formats its amounts.
 * The comparison is done here with BigInt on the raw values, instead of relying on
 * the relayer's `insufficient` flag, so that the hard minimum and the early-warning level
 * are always evaluated the same way.
 */
export const buildTokenBalanceReport = ({
  chain,
  token,
  minValue,
  currentBalance
}: RelayerTokenBalance): TokenBalanceReport => {
  const min = BigInt(minValue)
  const current = BigInt(currentBalance)
  const lowLevel = min * LOW_BALANCE_MULTIPLIER
  const metadata = getTokenMetadata(chain, token)
  const topUp = current < lowLevel ? lowLevel - current : 0n

  return {
    label: getTokenLabel(chain, token, metadata),
    status: getBalanceStatus(current, min, lowLevel),
    current: formatAmount(current, metadata),
    min: formatAmount(min, metadata),
    lowLevel: formatAmount(lowLevel, metadata),
    topUp: formatAmount(topUp, metadata)
  }
}

/** One line per token, e.g. `base USDC: has 2.28, minimum 2.0, top up 7.72 to reach 10.0` */
export const formatTokenBalanceReport = ({
  label,
  current,
  min,
  lowLevel,
  topUp
}: TokenBalanceReport) =>
  `${label}: has ${current}, minimum ${min}, top up ${topUp} to reach ${lowLevel}`

const isUnsignedIntegerString = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  [...value].every((char) => char >= '0' && char <= '9')

const isRelayerTokenBalance = (entry: any): entry is RelayerTokenBalance =>
  !!entry &&
  typeof entry.chain === 'string' &&
  typeof entry.token === 'string' &&
  isUnsignedIntegerString(entry.minValue) &&
  isUnsignedIntegerString(entry.currentBalance)

/**
 * Fetches the balances of an e2e funding account from the relayer.
 *
 * The relayer responds with 200 when every token is above its minimum and with 500
 * when at least one is below it, but with the same token list in both cases.
 * So the status code is ignored and the request fails only when the list itself is
 * missing (relayer down, timeout, unexpected response), which is worth retrying,
 * unlike a real shortfall.
 */
export const fetchE2eBalances = async (address: string): Promise<RelayerTokenBalance[]> => {
  const failurePrefix = `Could not check the balance of ${address}, the relayer`

  let status: number
  let body: string
  try {
    const response = await fetch(`${RELAYER_E2E_BALANCE_URL}/${address}`, {
      signal: AbortSignal.timeout(RELAYER_REQUEST_TIMEOUT_MS)
    })
    status = response.status
    body = await response.text()
  } catch (error) {
    throw new Error(`${failurePrefix} is unreachable: ${error?.message || error}`, {
      cause: error
    })
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(body)
  } catch (error) {
    throw new Error(`${failurePrefix} returned a non-JSON response (status ${status}): ${body}`, {
      cause: error
    })
  }

  const isTokenList =
    Array.isArray(parsedBody) && parsedBody.length > 0 && parsedBody.every(isRelayerTokenBalance)
  if (!isTokenList) {
    throw new Error(`${failurePrefix} returned an unexpected response (status ${status}): ${body}`)
  }

  return parsedBody as RelayerTokenBalance[]
}

const STATUS_LABELS: Record<BalanceStatus, string> = {
  ok: '✅ ok',
  low: '⚠️ low',
  insufficient: '❌ insufficient'
}

const GITHUB_ANNOTATION_BY_STATUS: Partial<
  Record<BalanceStatus, { level: string; title: string }>
> = {
  low: { level: 'warning', title: 'E2E funds running low' },
  insufficient: { level: 'error', title: 'E2E funds insufficient' }
}

/**
 * Written to the alert file when at least one token is below its hard minimum.
 * The balance monitor workflow looks for it to mark the alert as urgent.
 */
export const INSUFFICIENT_BALANCE_ALERT_MARKER = '<!-- e2e-balance:insufficient -->'

const buildMarkdownTable = (accountTitle: string, reports: TokenBalanceReport[]) => {
  const tableRows = reports.map(
    ({ label, status, current, min, lowLevel, topUp }) =>
      `| ${label} | ${STATUS_LABELS[status]} | ${current} | ${min} | ${lowLevel} | ${topUp} |`
  )

  return [
    `### ${accountTitle}`,
    '',
    '| Token | Status | Balance | Minimum | Low level | Top up |',
    '| --- | --- | --- | --- | --- | --- |',
    ...tableRows,
    '',
    ''
  ].join('\n')
}

/**
 * Makes the balances visible on the GitHub Actions run page, without opening the logs:
 * a table of all tokens in the job summary and an annotation for each token that needs a top-up.
 * Does nothing outside of GitHub Actions.
 */
export const publishBalanceReportsToGitHub = (
  accountTitle: string,
  reports: TokenBalanceReport[]
) => {
  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY
  if (!process.env.GITHUB_ACTIONS || !stepSummaryPath) return

  const summary = buildMarkdownTable(accountTitle, reports)
  appendFileSync(stepSummaryPath, summary)

  reports.forEach((report) => {
    const annotation = GITHUB_ANNOTATION_BY_STATUS[report.status]
    if (!annotation) return

    // GitHub picks up workflow commands printed on their own line in the job output
    console.log(
      `::${annotation.level} title=${annotation.title}::${accountTitle} - ${formatTokenBalanceReport(
        report
      )}`
    )
  })
}

/**
 * Appends the tokens of an account that need a top-up to the file set in `E2E_BALANCE_ALERT_FILE`.
 * The scheduled balance monitor workflow turns that file into a GitHub issue (and a Slack message).
 * Does nothing when the variable is not set or when the account doesn't need a top-up.
 */
export const appendBalanceAlert = (accountTitle: string, reports: TokenBalanceReport[]) => {
  const alertFilePath = process.env.E2E_BALANCE_ALERT_FILE
  if (!alertFilePath) return

  const tokensToTopUp = reports.filter(({ status }) => status !== 'ok')
  if (!tokensToTopUp.length) return

  const hasInsufficientToken = tokensToTopUp.some(({ status }) => status === 'insufficient')
  const marker = hasInsufficientToken ? `${INSUFFICIENT_BALANCE_ALERT_MARKER}\n` : ''

  appendFileSync(alertFilePath, `${marker}${buildMarkdownTable(accountTitle, tokensToTopUp)}`)
}
