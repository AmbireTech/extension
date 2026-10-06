import { baParams, ledgerSaParams, saParams } from 'constants/env'
import { formatUnits } from 'ethers'

import { expect, test } from '@playwright/test'

// format raw token amounts received from relayer for better readability
const NATIVE_GAS_TANK_TOKEN_DECIMALS = 6

const formatTokenAmount = (token: string, raw: bigint) =>
  token === 'native'
    ? `${formatUnits(raw, NATIVE_GAS_TANK_TOKEN_DECIMALS)} (raw: ${raw.toString()})`
    : raw.toString()

type InsufficientToken = {
  chain: string
  addr: string
  token: string
  minValue: string
  currentBalance: string
  insufficient: boolean
}

const RELAYER_E2E_BALANCE_URL = 'https://relayer.ambire.com/v2/e2eBalance'

// The relayer checks the funding addresses against a predefined set of tokens
// and minimum balances. It returns 200 when every token is sufficiently funded
// and 500 when at least one token is below its threshold. This lets us verify
// the e2e funding accounts without booting up the extension.
const ACCOUNTS: { name: string; address: string }[] = [
  { name: 'Basic Account', address: baParams.envSelectedAccount },
  { name: 'Smart Account', address: saParams.envSelectedAccount },
  { name: 'Ledger SA e2e tests', address: ledgerSaParams.envSelectedAccount }
]

test.describe('Tokens balance check', { tag: '@balanceCheck' }, () => {
  for (const { name, address } of ACCOUNTS) {
    test(`${name} - check balance of test tokens`, async ({ request }) => {
      const response = await request.get(`${RELAYER_E2E_BALANCE_URL}/${address}`)

      if (response.ok()) return

      const body = await response.text()
      let tokens: InsufficientToken[]
      try {
        tokens = JSON.parse(body)
      } catch {
        throw new Error(
          `${name} (${address}) balance check failed with status ${response.status()}: ${body}`
        )
      }

      const insufficientTokens = tokens.filter((token) => token.insufficient)

      const report = insufficientTokens
        .map(({ chain, token, minValue, currentBalance }) => {
          const min = BigInt(minValue)
          const current = BigInt(currentBalance)
          const missing = min - current

          return `  - ${chain} ${token}: has ${formatTokenAmount(
            token,
            current
          )}, needs ${formatTokenAmount(token, min)}, missing ${formatTokenAmount(token, missing)}`
        })
        .join('\n')

      expect(
        insufficientTokens,
        `${name} (${address}) has insufficient balance:\n${report}`
      ).toHaveLength(0)
    })
  }
})
