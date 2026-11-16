import { baParams, ledgerSaParams, saParams } from 'constants/env'
import {
  buildTokenBalanceReport,
  fetchE2eBalances,
  formatTokenBalanceReport,
  publishBalanceReportsToGitHub,
  RelayerTokenBalance,
  TokenBalanceReport
} from 'utils/e2eBalance'

import { expect, test } from '@playwright/test'

// The relayer checks the funding addresses against a predefined set of tokens
// and minimum balances, and returns the current balance of each one. This lets us
// verify the e2e funding accounts without booting up the extension. A token below
// its minimum fails the run, a token that is only getting close to it is reported
// as a warning, so that it can be topped up before it starts failing runs.
const ACCOUNTS: { name: string; address: string }[] = [
  { name: 'Basic Account', address: baParams.envSelectedAccount },
  { name: 'Smart Account', address: saParams.envSelectedAccount },
  { name: 'Ledger SA e2e tests', address: ledgerSaParams.envSelectedAccount }
]

const RELAYER_RETRY_INTERVALS_MS = [2 * 1000, 5 * 1000, 10 * 1000]
const RELAYER_RETRY_TIMEOUT_MS = 60 * 1000

const formatReportList = (reports: TokenBalanceReport[]) =>
  reports.map((report) => `  - ${formatTokenBalanceReport(report)}`).join('\n')

const getVerdict = (
  accountName: string,
  lowTokens: TokenBalanceReport[],
  insufficientTokens: TokenBalanceReport[]
) => {
  if (insufficientTokens.length) {
    return `${accountName} has insufficient balance for ${insufficientTokens.length} token(s)`
  }
  if (lowTokens.length) {
    return `${accountName} has sufficient balance at the moment, but ${lowTokens.length} token(s) are running low`
  }

  return `${accountName} has sufficient balance at the moment`
}

test.describe('Tokens balance check', { tag: '@balanceCheck' }, () => {
  // Retrying the whole test doesn't help when the funds are insufficient.
  // Only the relayer request is worth retrying and that is done inside the test.
  test.describe.configure({ retries: 0 })

  for (const { name, address } of ACCOUNTS) {
    test(`${name} - check balance of test tokens`, async () => {
      const accountTitle = `${name} (${address})`

      let balances: RelayerTokenBalance[] = []
      await test.step('Get the current balances from the relayer', async () => {
        await expect(async () => {
          balances = await fetchE2eBalances(address)
        }).toPass({ intervals: RELAYER_RETRY_INTERVALS_MS, timeout: RELAYER_RETRY_TIMEOUT_MS })
      })

      const reports = balances.map(buildTokenBalanceReport)
      const lowTokens = reports.filter(({ status }) => status === 'low')
      const insufficientTokens = reports.filter(({ status }) => status === 'insufficient')

      publishBalanceReportsToGitHub(accountTitle, reports)

      if (lowTokens.length) {
        const warning = `${accountTitle} is running low on funds, top up soon:\n${formatReportList(
          lowTokens
        )}`
        console.warn(`⚠️ ${warning}`)
        // Shown in the HTML report
        test.info().annotations.push({ type: 'low balance', description: warning })
      }

      // The step title is the verdict shown in the HTML report. The failure is thrown instead of
      // asserted with `expect`, because the report lists every `expect` as a step named after
      // its message, so a passing run would show "has insufficient balance"
      await test.step(getVerdict(name, lowTokens, insufficientTokens), async () => {
        if (!insufficientTokens.length) return

        throw new Error(
          `${accountTitle} has insufficient balance:\n${formatReportList(insufficientTokens)}`
        )
      })
    })
  }
})
