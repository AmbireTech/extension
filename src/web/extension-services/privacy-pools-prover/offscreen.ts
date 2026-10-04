/**
 * The Privacy Pools prover's offscreen document (Chrome only).
 *
 * The background is a service worker, which has no `Worker`, so ffjavascript proves on one thread
 * there. This document has one, so the same proof runs on every core - see
 * `createOffscreenProverFactory` for the background's side. ffjavascript starts its threads from a
 * `blob:` URL, which Chrome allows here: one the extension created counts as its own origin under
 * `script-src 'self'`.
 *
 * It handles the most sensitive inputs the wallet has besides the keys themselves, so it is kept
 * to the minimum: no UI, no Sentry, no storage, no network beyond its own artifacts. It is bundled
 * under LavaMoat like the background, and logs errors only to its own console.
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
  // The background closes the document when it is done with it, possibly while a proof is running
  if (isConnected) port.postMessage(message)
}

/**
 * Loads the artifacts and builds the curve before reporting ready. Building the curve is what
 * starts the worker threads, so a document whose workers cannot load stops here - and the
 * background proves on its own instead - rather than on a user's withdrawal.
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
      // Decoded from what `encodeSignals` produced from the SDK's own inputs for this circuit
      decodeSignals(request.signals) as Parameters<typeof prover.prove>[1]
    )

    send({ type: 'proved', id: request.id, proof, publicSignals })
  } catch (error) {
    // Logged here only: an error from the circuit can describe the inputs, so it never leaves this
    // document
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

// The background never reopens a port: when it goes away - closing this document, or its service
// worker restarting - this document is of no further use
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
