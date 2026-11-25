import dotenv from 'dotenv'
import path from 'path'

// On CI the addresses come from the job's environment, locally from the root `.env`
if (!process.env.CI) dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const getAddress = (variable: string) => {
  const address = process.env[variable]
  if (!address) throw new Error(`Missing required environment variable: ${variable}`)

  return address
}

/**
 * The accounts the e2e tests spend from. Only their public addresses are read here
 * (instead of using `constants/env`), so that checking their balances doesn't require
 * any of the keys and seeds of the test accounts.
 */
const FUNDING_ACCOUNTS: { name: string; address: string }[] = [
  { name: 'Basic Account', address: getAddress('BA_SELECTED_ACCOUNT') },
  { name: 'Smart Account', address: getAddress('SA_SELECTED_ACCOUNT') },
  { name: 'Ledger SA e2e tests', address: getAddress('LEDGER_SA_SELECTED_ACCOUNT') }
]

export default FUNDING_ACCOUNTS
