import { createOffscreenProverFactory } from './offscreenProverFactory'
import { decodeSignals, encodeSignals } from './protocol'

jest.mock('@fatsolutions/privacy-pools-core-circuits', () => ({
  WithdrawSignalMapper: (publicSignals: string[]) => ({ circuit: 'withdraw', publicSignals }),
  CommitmentSignalMapper: (publicSignals: string[]) => ({ circuit: 'commitment', publicSignals })
}))

const EXTENSION_ID = 'own-extension-id'
const DOCUMENT_URL = `chrome-extension://${EXTENSION_ID}/privacy-pools-prover.html`
const IDLE_CLOSE_MS = 2 * 60 * 1000
const PROOF_TIMEOUT_MS = 3 * 60 * 1000
const STARTUP_TIMEOUT_MS = 30 * 1000

/** Inputs shaped like the withdraw circuit's: secrets among them. */
const SIGNALS = {
  existingSecret: 123456789n,
  existingNullifier: 987654321n,
  stateSiblings: [1n, 2n, 0n]
}
const PROOF = { pi_a: ['1'], pi_b: [['2']], pi_c: ['3'], protocol: 'groth16', curve: 'bn128' }
const PUBLIC_SIGNALS = ['11', '12', '13', '14', '15', '16', '17', '18']

const makeEvent = <Args extends unknown[]>() => {
  const listeners = new Set<(...args: Args) => void>()
  return {
    addListener: (listener: (...args: Args) => void) => listeners.add(listener),
    removeListener: (listener: (...args: Args) => void) => listeners.delete(listener),
    dispatch: (...args: Args) => listeners.forEach((listener) => listener(...args))
  }
}

class FakePort {
  name: string

  sender: { id?: string; url?: string; tab?: object }

  sent: any[] = []

  isDisconnected = false

  onMessage = makeEvent<[any]>()

  onDisconnect = makeEvent<[]>()

  constructor(name: string, sender: FakePort['sender']) {
    this.name = name
    this.sender = sender
  }

  postMessage(message: any) {
    this.sent.push(message)
  }

  disconnect() {
    this.isDisconnected = true
  }

  /** The other end going away, as when the document is closed. */
  close() {
    this.onDisconnect.dispatch()
  }
}

let onConnect: ReturnType<typeof makeEvent<[FakePort]>>
let isDocumentOpen: boolean
let createDocument: jest.Mock
let closeDocument: jest.Mock
/** What the fake document does once created - by default, connect and report ready. */
let onDocumentCreated: () => void
let documentPort: FakePort | null

const connect = (sender: FakePort['sender'], name = 'privacy-pools-prover') => {
  const port = new FakePort(name, sender)
  onConnect.dispatch(port)
  return port
}

const connectDocument = () => {
  documentPort = connect({ id: EXTENSION_ID, url: DOCUMENT_URL })
  return documentPort
}

/** Answers every proof request the document receives with `answer`. */
const answerProofs = (port: FakePort, answer: (request: any) => any) => {
  const postMessage = port.postMessage.bind(port)
  port.postMessage = (message: any) => {
    postMessage(message)
    port.onMessage.dispatch(answer(message))
  }
}

const proved = (request: any) => ({
  type: 'proved',
  id: request.id,
  proof: PROOF,
  publicSignals: PUBLIC_SIGNALS
})

const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

const prepare = () => {
  const fallbackProve = jest.fn(async () => ({
    proof: PROOF,
    publicSignals: PUBLIC_SIGNALS,
    mappedSignals: { from: 'fallback' }
  }))
  const fallback = jest.fn(async () => ({ prove: fallbackProve }) as any)
  const onError = jest.fn()
  const proverFactory = createOffscreenProverFactory({ fallback, onError })

  return { proverFactory, fallback, fallbackProve, onError }
}

beforeEach(() => {
  // So the idle and timeout timers a test leaves behind never fire into the next one
  jest.useFakeTimers()
  onConnect = makeEvent<[FakePort]>()
  isDocumentOpen = false
  documentPort = null
  onDocumentCreated = () => {
    const port = connectDocument()
    answerProofs(port, proved)
    port.onMessage.dispatch({ type: 'ready' })
  }
  createDocument = jest.fn(async () => {
    isDocumentOpen = true
    onDocumentCreated()
  })
  closeDocument = jest.fn(async () => {
    isDocumentOpen = false
    documentPort?.close()
  })
  ;(global as any).chrome = {
    runtime: {
      id: EXTENSION_ID,
      getURL: (path: string) => `chrome-extension://${EXTENSION_ID}/${path}`,
      onConnect,
      getContexts: jest.fn(async () => (isDocumentOpen ? [{}] : []))
    },
    offscreen: { createDocument, closeDocument }
  }
})

afterEach(() => {
  jest.clearAllTimers()
  jest.useRealTimers()
})

afterAll(() => {
  delete (global as any).chrome
})

describe('protocol', () => {
  it('carries bigint inputs as decimal strings and back', () => {
    const encoded = encodeSignals(SIGNALS)

    expect(encoded).toEqual({
      existingSecret: '123456789',
      existingNullifier: '987654321',
      stateSiblings: ['1', '2', '0']
    })
    // Extension messaging serializes as JSON, which a bigint would not survive
    expect(JSON.parse(JSON.stringify(encoded))).toEqual(encoded)
    expect(decodeSignals(encoded)).toEqual(SIGNALS)
  })

  it('refuses inputs in any other form', () => {
    expect(() => encodeSignals({ value: 1 })).toThrow()
    expect(() => encodeSignals({ siblings: [1n, '2'] })).toThrow()
    expect(() => decodeSignals({ value: 1 })).toThrow()
    expect(() => decodeSignals({ value: 'not-a-number' })).toThrow()
    expect(() => decodeSignals(['1'])).toThrow()
    expect(() => decodeSignals(null)).toThrow()
  })
})

describe('createOffscreenProverFactory', () => {
  it('proves in the document, sending it the inputs and mapping what comes back', async () => {
    const { proverFactory, fallback } = prepare()
    const prover = await proverFactory()

    const result = await prover.prove('withdraw', SIGNALS as any)

    expect(createDocument).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'privacy-pools-prover.html', reasons: ['WORKERS'] })
    )
    expect(documentPort!.sent).toEqual([
      { type: 'prove', id: 1, circuit: 'withdraw', signals: encodeSignals(SIGNALS) }
    ])
    expect(result).toEqual({
      proof: PROOF,
      publicSignals: PUBLIC_SIGNALS,
      mappedSignals: { circuit: 'withdraw', publicSignals: PUBLIC_SIGNALS }
    })
    expect(fallback).not.toHaveBeenCalled()
  })

  it('reuses one document across proofs', async () => {
    const { proverFactory } = prepare()
    const prover = await proverFactory()

    await prover.prove('withdraw', SIGNALS as any)
    const second = await prover.prove('commitment', { value: 1n } as any)

    expect(createDocument).toHaveBeenCalledTimes(1)
    expect(second.mappedSignals).toEqual({ circuit: 'commitment', publicSignals: PUBLIC_SIGNALS })
  })

  describe('who gets the inputs', () => {
    const senders = {
      'a content script, which has a tab': { id: EXTENSION_ID, url: DOCUMENT_URL, tab: {} },
      'another page of the extension': {
        id: EXTENSION_ID,
        url: `chrome-extension://${EXTENSION_ID}/tab.html`
      },
      'another extension': { id: 'other-extension-id', url: DOCUMENT_URL },
      'a sender without a URL': { id: EXTENSION_ID }
    }

    Object.entries(senders).forEach(([description, sender]) => {
      it(`disconnects ${description} and never sends it anything`, async () => {
        let impostor: FakePort | null = null
        onDocumentCreated = () => {
          // Connects first, while the real document is starting, and claims to be ready
          impostor = connect(sender)
          impostor.onMessage.dispatch({ type: 'ready' })
          const port = connectDocument()
          answerProofs(port, proved)
          port.onMessage.dispatch({ type: 'ready' })
        }
        const { proverFactory } = prepare()
        const prover = await proverFactory()

        await prover.prove('withdraw', SIGNALS as any)

        expect(impostor!.isDisconnected).toBe(true)
        expect(impostor!.sent).toEqual([])
        expect(documentPort!.sent).toHaveLength(1)
      })
    })

    it('disconnects the document itself when no document is starting', async () => {
      prepare()

      const port = connectDocument()

      expect(port.isDisconnected).toBe(true)
    })

    it('leaves ports of other names to their own listeners', async () => {
      prepare()

      const port = connect({ id: EXTENSION_ID, url: DOCUMENT_URL }, 'popup')

      expect(port.isDisconnected).toBe(false)
    })
  })

  describe('falling back to proving in the background', () => {
    let consoleError: jest.SpyInstance

    beforeEach(() => {
      consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      // Each fallback is logged, besides being reported through `onError`
      expect(consoleError).toHaveBeenCalledWith(
        'privacyPools: proving in this context instead of the prover document',
        expect.any(Error)
      )
      consoleError.mockRestore()
    })

    it('falls back for good when the document reports it could not start', async () => {
      onDocumentCreated = () => connectDocument().onMessage.dispatch({ type: 'startup-failed' })
      const { proverFactory, fallbackProve, onError } = prepare()
      const prover = await proverFactory()

      const result = await prover.prove('withdraw', SIGNALS as any)
      await prover.prove('withdraw', SIGNALS as any)

      expect(result.mappedSignals).toEqual({ from: 'fallback' })
      expect(fallbackProve).toHaveBeenCalledTimes(2)
      expect(fallbackProve).toHaveBeenCalledWith('withdraw', SIGNALS)
      // Asked once, told once, and the failed document is not left open
      expect(createDocument).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledTimes(1)
      expect(isDocumentOpen).toBe(false)
      expect(documentPort!.sent).toEqual([])
    })

    it('falls back when the document cannot be created', async () => {
      createDocument.mockRejectedValueOnce(new Error('offscreen documents are disabled'))
      const { proverFactory, fallbackProve, onError } = prepare()
      const prover = await proverFactory()

      await prover.prove('withdraw', SIGNALS as any)

      expect(fallbackProve).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(new Error('offscreen documents are disabled'))
    })

    it('falls back when the document never reports ready', async () => {
      onDocumentCreated = () => {
        connectDocument()
      }
      const { proverFactory, fallbackProve, onError } = prepare()
      const prover = await proverFactory()

      const proving = prover.prove('withdraw', SIGNALS as any)
      await jest.advanceTimersByTimeAsync(STARTUP_TIMEOUT_MS)
      await proving

      expect(fallbackProve).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        new Error('privacyPools: the proof generator took too long to start')
      )
      expect(closeDocument).toHaveBeenCalled()
      expect(documentPort!.sent).toEqual([])
    })
  })

  describe('a failed proof', () => {
    it('fails without anything from the document but that it failed', async () => {
      onDocumentCreated = () => {
        const port = connectDocument()
        answerProofs(port, (request) => ({
          type: 'prove-failed',
          id: request.id,
          message: 'Assert Failed: existingSecret=123456789'
        }))
        port.onMessage.dispatch({ type: 'ready' })
      }
      const { proverFactory, fallbackProve } = prepare()
      const prover = await proverFactory()

      await expect(prover.prove('withdraw', SIGNALS as any)).rejects.toThrow(
        new Error('privacyPools: the proof could not be generated')
      )
      // A proof that failed is not retried in the background, which would only fail again
      expect(fallbackProve).not.toHaveBeenCalled()
    })

    it('fails the proofs in flight when the document goes away, then opens a new one', async () => {
      onDocumentCreated = () => {
        connectDocument().onMessage.dispatch({ type: 'ready' })
      }
      const { proverFactory } = prepare()
      const prover = await proverFactory()

      const proving = prover.prove('withdraw', SIGNALS as any)
      await flush()
      documentPort!.close()

      await expect(proving).rejects.toThrow(
        'privacyPools: the proof generator stopped before finishing'
      )

      onDocumentCreated = () => {
        const port = connectDocument()
        answerProofs(port, proved)
        port.onMessage.dispatch({ type: 'ready' })
      }
      await expect(prover.prove('withdraw', SIGNALS as any)).resolves.toBeDefined()
      expect(createDocument).toHaveBeenCalledTimes(2)
    })

    it('gives up on a proof that never comes back and closes the document', async () => {
      onDocumentCreated = () => {
        connectDocument().onMessage.dispatch({ type: 'ready' })
      }
      const { proverFactory } = prepare()
      const prover = await proverFactory()

      const proving = prover.prove('withdraw', SIGNALS as any)
      const failure = expect(proving).rejects.toThrow(
        'privacyPools: generating the proof took too long'
      )
      await jest.advanceTimersByTimeAsync(PROOF_TIMEOUT_MS)

      await failure
      expect(closeDocument).toHaveBeenCalledTimes(1)
    })
  })

  describe('closing when idle', () => {
    it('closes the document once no proof has been asked for a while', async () => {
      const { proverFactory } = prepare()
      const prover = await proverFactory()

      await prover.prove('withdraw', SIGNALS as any)
      await jest.advanceTimersByTimeAsync(IDLE_CLOSE_MS - 1)
      expect(closeDocument).not.toHaveBeenCalled()

      await jest.advanceTimersByTimeAsync(1)
      expect(closeDocument).toHaveBeenCalledTimes(1)
      expect(isDocumentOpen).toBe(false)

      // And opens a new one for the next proof
      await prover.prove('withdraw', SIGNALS as any)
      expect(createDocument).toHaveBeenCalledTimes(2)
    })

    it('keeps it open while proofs keep coming', async () => {
      const { proverFactory } = prepare()
      const prover = await proverFactory()

      await prover.prove('withdraw', SIGNALS as any)
      await jest.advanceTimersByTimeAsync(IDLE_CLOSE_MS - 1)
      await prover.prove('withdraw', SIGNALS as any)
      await jest.advanceTimersByTimeAsync(IDLE_CLOSE_MS - 1)

      expect(closeDocument).not.toHaveBeenCalled()
      expect(createDocument).toHaveBeenCalledTimes(1)
    })
  })

  it('closes a document left over from before the background restarted', async () => {
    isDocumentOpen = true
    const { proverFactory } = prepare()
    const prover = await proverFactory()

    await prover.prove('withdraw', SIGNALS as any)

    expect(closeDocument).toHaveBeenCalledTimes(1)
    expect(createDocument).toHaveBeenCalledTimes(1)
  })
})
