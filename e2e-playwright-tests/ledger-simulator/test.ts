import TransportNodeSpeculos from '@ledgerhq/hw-transport-node-speculos'
import Eth from '@ledgerhq/hw-app-eth'
import { Transaction, parseEther, parseUnits } from 'ethers'

const SPECULOS_HOST = '127.0.0.1'
const SPECULOS_APDU_PORT = 9999

// Standard Ledger Ethereum app derivation path for the first account
const ETH_DERIVATION_PATH = "44'/60'/0'/0/0"

// Recipient address requested by the user
const RECIPIENT_ADDRESS = '0xC2E6dFcc2C6722866aD65F211D5757e1D2879337'

async function main() {
  console.log('Connecting to Speculos on', `${SPECULOS_HOST}:${SPECULOS_APDU_PORT}...`)

  const transport = await TransportNodeSpeculos.open({
    apduPort: SPECULOS_APDU_PORT,
    host: SPECULOS_HOST
  })

  try {
    const eth = new Eth(transport)

    console.log('Requesting Ethereum address from Ledger (path:', ETH_DERIVATION_PATH, ')')
    const addressResult = await eth.getAddress(ETH_DERIVATION_PATH, false, true)

    console.log('Device Ethereum address:')
    console.log('  Address:', addressResult.address)
    console.log('  Public key:', addressResult.publicKey)
    console.log('  Chain code:', addressResult.chainCode)

    // Optionally, you could combine the signature back into a fully signed tx
    // if you want to broadcast it using ethers or another library.
  } finally {
    await transport.close()
  }
}

main()