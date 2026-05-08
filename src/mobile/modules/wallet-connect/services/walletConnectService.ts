import '@walletconnect/react-native-compat'

import CONFIG from '@common/config/env'
import { Action, MethodAction } from '@common/types/actions'
import { WalletKit } from '@reown/walletkit'
import { Core } from '@walletconnect/core'
import { getSdkError } from '@walletconnect/utils'

let walletKit: any = null
let initialized = false
let initPromise: Promise<any> | null = null
let dispatchAction: ((action: MethodAction | Action) => void) | null = null

export const getWalletKit = () => walletKit
export const isWalletConnectInitialized = () => initialized

export const initWalletConnect = async (dispatch: (action: MethodAction | Action) => void) => {
  dispatchAction = dispatch

  if (initialized) {
    console.log('[WalletConnect] Already initialized, returning existing walletKit.')
    return walletKit
  }

  if (initPromise) {
    console.log('[WalletConnect] Initialization already in progress, waiting for existing promise.')
    return initPromise
  }

  initPromise = (async () => {
    try {
      console.log('[WalletConnect] Initialization started...')

      if (!CONFIG.WALLETCONNECT_PROJECT_ID) {
        throw new Error('WALLETCONNECT_PROJECT_ID is missing from configuration.')
      }

      console.log('[WalletConnect] Creating Core instance...')
      const core = new Core({ projectId: CONFIG.WALLETCONNECT_PROJECT_ID })

      console.log('[WalletConnect] Initializing WalletKit...')
      // We add a timeout to prevent indefinite hanging if the relay is unreachable
      const initResult = await Promise.race([
        WalletKit.init({
          core,
          metadata: {
            name: 'Ambire Wallet',
            description: 'The ultimate smart contract wallet',
            url: 'https://ambire.com/',
            icons: ['https://ambire.com/wallet-logo.png'],
            redirect: {
              native: 'ambire://',
              universal: 'https://ambire.com'
            }
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('WalletKit initialization timed out (15s)')), 15000)
        )
      ])

      walletKit = initResult
      console.log('[WalletConnect] WalletKit initialized successfully.')

      walletKit.on('session_proposal', async (proposal: any) => {
    try {
      const { id, params } = proposal
      const proposerUrl = params.proposer.metadata.url

      // Delegate to the webview via dispatch — the webview will create the
      // dapp session and process the eth_requestAccounts request via handleActions.
      dispatchAction!({
        type: 'HANDLE_PROVIDER_REQUEST',
        params: {
          request: { method: 'eth_requestAccounts', origin: proposerUrl },
          requestId: id,
          providerId: 1, // Single provider id for WC for now
          topic: `wc_session_proposal_${proposal.id.toString()}`
        }
      })
    } catch (e) {
      console.error(e)
    }
  })

  walletKit.on('session_request', async (requestEvent: any) => {
    try {
      const { topic, params, id } = requestEvent
      const { request } = params

      // We get the session to find the origin URL
      const activeSession = walletKit.engine.signClient.session.get(topic)
      const proposerUrl = activeSession?.peer?.metadata?.url

      // Delegate to the webview — handleActions will route the result
      // back to RN via sendToReactEvent('action.respondToWalletConnectRequest').
      dispatchAction!({
        type: 'HANDLE_PROVIDER_REQUEST',
        params: {
          request: { ...request, origin: proposerUrl || 'https://walletconnect.com' },
          requestId: id,
          providerId: 1,
          topic: `wc_session_request_${topic}`
        }
      })
    } catch (e) {
      console.error(e)
    }
  })

  walletKit.on('session_delete', (event: any) => {
    // We could clean up the dapp session here
  })

    initialized = true
    initPromise = null
    return walletKit
  } catch (e) {
    console.error('[WalletConnect] Initialization failed:', e)
    initPromise = null
    throw e
  }
})()

  return initPromise
}

export const respondToWalletConnectRequest = async (topic: string, response: any, id: number) => {
  if (!walletKit) return

  if (response.error) {
    await walletKit.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: {
          code: 5000,
          message: response.error?.message || 'User rejected request'
        }
      }
    })
  } else {
    await walletKit.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        result: response.result
      }
    })
  }
}

export const approveWalletConnectSession = async (proposalId: number, accounts: string[]) => {
  if (!walletKit) return

  // Need the original proposal to approve
  const proposals = walletKit.engine.signClient.proposal.values
  const proposal = proposals.find((p: any) => p.id === proposalId)
  if (!proposal) return

  const { id, params } = proposal
  const { requiredNamespaces, optionalNamespaces } = params

  const namespaces: any = {}

  const allNamespaces = { ...requiredNamespaces, ...optionalNamespaces }
  if (allNamespaces.eip155) {
    namespaces.eip155 = {
      accounts:
        allNamespaces.eip155.chains?.map((c: string) => accounts.map((a) => `${c}:${a}`)).flat() ||
        accounts.map((a: string) => `eip155:1:${a}`),
      methods: allNamespaces.eip155.methods || [
        'personal_sign',
        'eth_sendTransaction',
        'eth_signTypedData_v4',
        'wallet_switchEthereumChain'
      ],
      events: allNamespaces.eip155.events || ['accountsChanged', 'chainChanged']
    }
  }

  const session = await walletKit.approveSession({
    id,
    namespaces
  })

  const wcTabId = id.toString()
  const proposerUrl = params.proposer.metadata.url

  // Delegate session messenger setup to the webview — it will create the
  // dapp session and attach a wcBridgeMessenger that routes broadcast
  // events (disconnect, chainChanged, etc.) back to RN.
  dispatchAction!({
    type: 'SETUP_WC_SESSION_MESSENGER',
    params: {
      url: proposerUrl,
      tabId: wcTabId,
      wcSessionTopic: session.topic,
      chainId: 1
    }
  })

  return session
}

export const rejectWalletConnectSession = async (proposalId: number) => {
  if (!walletKit) return

  await walletKit.rejectSession({
    id: proposalId,
    reason: getSdkError('USER_REJECTED')
  })
}

/**
 * Handles broadcast events from the webview's wcBridgeMessenger.
 * When a dapp session in the webview broadcasts an event (e.g. disconnect,
 * chainChanged, accountsChanged), the wcBridgeMessenger sends it back to RN
 * via sendToReactEvent, and this function translates it into the appropriate
 * WalletConnect SDK call.
 */
export const handleWcSessionBroadcast = async (payload: {
  wcSessionTopic: string
  chainId: number
  event: string
  data: any
}) => {
  if (!walletKit) return

  if (payload.event === 'disconnect') {
    await walletKit.disconnectSession({
      topic: payload.wcSessionTopic,
      reason: getSdkError('USER_DISCONNECTED')
    })
    return
  }

  await walletKit.emitSessionEvent({
    topic: payload.wcSessionTopic,
    event: { name: payload.event, data: payload.data },
    chainId: `eip155:${payload.chainId}`
  })
}
