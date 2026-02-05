/* eslint-disable no-console */
// Simple Speculos smoke test:
// Connects to the Speculos Ethereum app and prints the first account address.

const TransportNodeSpeculos = require('@ledgerhq/hw-transport-node-speculos').default
const Eth = require('@ledgerhq/hw-app-eth').default

const SPECULOS_HOST = process.env.SPECULOS_HOST || '127.0.0.1'
const SPECULOS_APDU_PORT = Number(process.env.SPECULOS_APDU_PORT || '9999')

// Standard Ledger Ethereum app derivation path for the first account
const ETH_DERIVATION_PATH = "44'/60'/0'/0/0"

async function main() {
  console.log(
    '[speculos] Connecting to Speculos on',
    `${SPECULOS_HOST}:${SPECULOS_APDU_PORT}...`
  )

  const transport = await TransportNodeSpeculos.open({
    apduPort: SPECULOS_APDU_PORT,
    host: SPECULOS_HOST
  })

  try {
    const eth = new Eth(transport)

    console.log(
      '[speculos] Requesting Ethereum address from Ledger (path:',
      ETH_DERIVATION_PATH,
      ')'
    )
    const addressResult = await eth.getAddress(ETH_DERIVATION_PATH, false, true)

    console.log('[speculos] Device Ethereum address:')
    console.log('  Address:', addressResult.address)
    console.log('  Public key:', addressResult.publicKey)
    console.log('  Chain code:', addressResult.chainCode)
  } finally {
    await transport.close()
  }
}

main().catch((err) => {
  console.error('[speculos] Error while talking to Speculos:', err)
  process.exitCode = 1
})

