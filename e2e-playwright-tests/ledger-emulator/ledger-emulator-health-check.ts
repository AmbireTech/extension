import EthImport from '@ledgerhq/hw-app-eth'
import TransportNodeSpeculosImport from '@ledgerhq/hw-transport-node-speculos'

const Eth = (EthImport as any).default ?? EthImport
const TransportNodeSpeculos =
  (TransportNodeSpeculosImport as any).default ?? TransportNodeSpeculosImport

const EMULATOR_HOST = '127.0.0.1'
const EMULATOR_APDU_PORT = 9999

// Standard Ledger Ethereum app derivation path for the first account
const ETH_DERIVATION_PATH = "44'/60'/0'/0/0"

async function main() {
  console.log('Connecting to Speculos on', `${EMULATOR_HOST}:${EMULATOR_APDU_PORT}...`)

  const transport = await TransportNodeSpeculos.open({
    apduPort: EMULATOR_APDU_PORT,
    host: EMULATOR_HOST
  })

  try {
    const eth = new Eth(transport)

    console.log('Requesting Ethereum address from Ledger (path:', ETH_DERIVATION_PATH, ')')
    const addressResult = await eth.getAddress(ETH_DERIVATION_PATH)

    console.log('Ledger emulator is UP and running!')
    console.log('Device Ethereum address:')
    console.log('  Address:', addressResult.address)
    console.log('  Public key:', addressResult.publicKey)
    console.log('  Chain code:', addressResult.chainCode)
  } finally {
    await transport.close()
  }
}

main()
