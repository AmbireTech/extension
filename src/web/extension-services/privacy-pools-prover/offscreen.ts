/**
 * The Privacy Pools prover's offscreen document (Chrome only). A service worker has no `Worker`,
 * so ffjavascript proves on one thread there; here it uses every core. Its threads start from a
 * `blob:` URL, which `script-src 'self'` allows when the extension created it.
 *
 * It handles the most sensitive inputs after the keys, so it is minimal: no UI, no Sentry, no
 * storage, no network beyond its artifacts, bundled under LavaMoat, logs only to its own console.
 */
import { curves } from 'snarkjs'

import { createProverFactory } from '@ambire-common/libs/privacyPools/prover'

import {
  decodeSignals,
  isPrivacyPoolsCircuit,
  PRIVACY_POOLS_PROVER_PORT_NAME,
  ProveRequest,
  ProverMessage
} from './protocol'

const getProver = createProverFactory(chrome.runtime.getURL('privacy-pools-circuits/'))

const port = chrome.runtime.connect({ name: PRIVACY_POOLS_PROVER_PORT_NAME })
let isConnected = true

const send = (message: ProverMessage) => {
  // The background may close the document while a proof is running
  if (isConnected) port.postMessage(message)
}

/**
 * Loads the artifacts and builds the curve (which starts the worker threads) before reporting
 * ready, so broken workers fail here and the background falls back, not during a withdrawal.
 */
const getReady = async () => {
  await curves.getCurveFromName('bn128')
  await getProver()
}

const prove = async (request: ProveRequest) => {
  try {
    if (!isPrivacyPoolsCircuit(request.circuit))
      throw new Error('privacyPools: a proof was asked for an unknown circuit')

    const prover = await getProver()
    const { proof, publicSignals } = await prover.prove(
      request.circuit,
      // Encoded by `encodeSignals` from the SDK's inputs for this circuit
      decodeSignals(request.signals) as Parameters<typeof prover.prove>[1]
    )

    send({ type: 'proved', id: request.id, proof, publicSignals })
  } catch (error) {
    // Logged here only: a circuit error can reveal the inputs
    console.error('privacyPools: a proof could not be generated', error)
    send({ type: 'prove-failed', id: request.id })
  }
}

port.onMessage.addListener((message: ProveRequest) => {
  if (message?.type !== 'prove' || typeof message.id !== 'number') {
    console.error('privacyPools: the prover document received an unexpected message')
    return
  }

  prove(message).catch((error) => {
    console.error('privacyPools: a proof request could not be answered', error)
  })
})

// The background never reopens a port, so once it is gone this document is useless
port.onDisconnect.addListener(() => {
  isConnected = false
  window.close()
})

getReady().then(
  () => send({ type: 'ready' }),
  (error) => {
    console.error('privacyPools: the prover document could not start', error)
    send({ type: 'startup-failed' })
  }
)
