import '@walletconnect/react-native-compat'

import CONFIG from '@common/config/env'
import { Action, MethodAction } from '@common/types/actions'
import { WalletKit } from '@reown/walletkit'
import { Core } from '@walletconnect/core'
import { getSdkError } from '@walletconnect/utils'

type WalletKitType = InstanceType<typeof WalletKit>
let walletKit: WalletKitType | null = null
let initialized = false
let initPromise: Promise<WalletKitType> | null = null
let pendingRestoreSessions: { topic: string; url: string; chainId: number }[] | null = null
let dispatchAction:
  | ((action: MethodAction | Action, windowId?: number, raw?: boolean) => void)
  | null = null

export const getWalletKit = () => walletKit
export const isWalletConnectInitialized = () => initialized

function guessDappName(rawName: string, url: string) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const parts = host.split('.')
    const domainCore = parts.slice(0, -1).join('.')

    const domainWords = domainCore.split('.').map((w) => w.toLowerCase())

    const matches: any[] = []
    for (const word of domainWords) {
      const regex = new RegExp(`\\b${word}\\b`, 'i')
      const match = rawName.match(regex)
      if (match) {
        matches.push({ word: match[0], index: match.index })
      }
    }

    if (matches.length > 0) {
      matches.sort((a, b) => a.index - b.index)
      return matches
        .map((m) => m.word)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    }
  } catch (e) {
    // ignore
  }
  return rawName.trim()
}

const fetchDappName = async (url: string): Promise<string | null> => {
  try {
    const res = await Promise.race([
      fetch(url, {
        headers: {
          Accept: 'text/html',
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
        }
      }),
      new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ])
    if (!res.ok) return null
    const html = await res.text()

    const manifestMatch =
      html.match(/<link[^>]*rel=["']manifest["'][^>]*href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']manifest["']/i)
    if (manifestMatch && manifestMatch[1]) {
      try {
        const manifestUrl = new URL(manifestMatch[1], url).href
        const manifestRes = await fetch(manifestUrl)
        if (manifestRes.ok) {
          const json = await manifestRes.json()
          if (json.name) return String(json.name).trim()
          if (json.short_name) return String(json.short_name).trim()
        }
      } catch (e) {
        // ignore manifest errors
      }
    }

    const ogMatch =
      html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:site_name["']/i) ||
      html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i) ||
      html.match(/<meta[^>]*name=["']application-name["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']application-name["']/i)
    if (ogMatch && ogMatch[1]) {
      return ogMatch[1].trim()
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch && titleMatch[1]) {
      return guessDappName(titleMatch[1].trim(), url)
    }
  } catch (e) {
    console.warn('[WalletConnect] Failed to fetch DApp name from HTML:', e)
  }
  return null
}

export const initWalletConnect = async (
  dispatch: (action: MethodAction | Action, windowId?: number, raw?: boolean) => void
) => {
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
        new Promise<WalletKitType>((_, reject) =>
          setTimeout(() => reject(new Error('WalletKit initialization timed out (15s)')), 15000)
        )
      ])

      walletKit = initResult
      console.log('[WalletConnect] WalletKit initialized successfully.')

      walletKit.on('session_proposal', async (proposal: any) => {
        try {
          const { id, params } = proposal
          const proposerUrl = params.proposer.metadata.url

          let proposerName = params.proposer.metadata.name
          let proposerIcon = params.proposer.metadata.icons[0]

          const fetchedName = await fetchDappName(proposerUrl)
          if (fetchedName) {
            proposerName = fetchedName
          } else if (!proposerName || proposerName === 'Signature Validator') {
            try {
              proposerName = new URL(proposerUrl).hostname
            } catch (e) {
              // ignore
            }
          }

          if (proposerIcon) {
            try {
              proposerIcon = new URL(proposerIcon, proposerUrl).href
            } catch (e) {
              // ignore invalid url
            }
          }

          console.log(proposerName, proposerIcon)

          dispatchAction!(
            {
              type: 'HANDLE_PROVIDER_REQUEST',
              params: {
                request: {
                  method: 'tabCheckin',
                  origin: proposerUrl,
                  params: { name: proposerName, icon: proposerIcon }
                },
                requestId: 0,
                providerId: 1,
                topic: `wc_session_checkin_${proposal.id.toString()}`
              }
            },
            undefined,
            true
          )

          // Delegate to the webview via dispatch — the webview will create the
          // dapp session and process the eth_requestAccounts request via handleActions.
          dispatchAction!(
            {
              type: 'HANDLE_PROVIDER_REQUEST',
              params: {
                request: { method: 'eth_requestAccounts', origin: proposerUrl },
                requestId: id,
                providerId: 1, // Single provider id for WC for now
                topic: `wc_session_proposal_${proposal.id.toString()}`
              }
            },
            undefined,
            true
          )
        } catch (e) {
          console.error(e)
        }
      })

      walletKit.on('session_request', async (requestEvent: any) => {
        try {
          const { topic, params, id } = requestEvent
          const { request } = params

          // We get the session to find the origin URL
          const activeSession = walletKit?.engine.signClient.session.get(topic)
          const proposerUrl = activeSession?.peer?.metadata?.url

          let proposerName = activeSession?.peer?.metadata?.name
          let proposerIcon = activeSession?.peer?.metadata?.icons?.[0]

          const fetchedName = await fetchDappName(proposerUrl || '')
          if (fetchedName) {
            proposerName = fetchedName
          } else if (!proposerName || proposerName === 'Signature Validator') {
            try {
              proposerName = new URL(proposerUrl || '').hostname
            } catch (e) {
              // ignore
            }
          }

          if (proposerIcon && proposerUrl) {
            try {
              proposerIcon = new URL(proposerIcon, proposerUrl).href
            } catch (e) {
              // ignore invalid url
            }
          }

          // Delegate to the webview — handleActions will route the result
          // back to RN via sendToReactEvent('action.respondToWalletConnectRequest').
          dispatchAction!(
            {
              type: 'HANDLE_PROVIDER_REQUEST',
              params: {
                request: { ...request, origin: proposerUrl || 'https://walletconnect.com' },
                requestId: id,
                providerId: 1,
                topic: `wc_session_request_${topic}`
              }
            },
            undefined,
            true
          )
        } catch (e) {
          console.error(e)
        }
      })

      walletKit.on('session_delete', (event: any) => {
        // Clean up the dapp session when WalletConnect session is deleted
        // The handler will look up the session by wcTopic to get the dappId and URL
        const { topic } = event
        console.log('[WalletConnect] session_delete event received, topic:', topic)
        if (topic) {
          console.log(
            '[WalletConnect] Dispatching DAPPS_CONTROLLER_DISCONNECT_DAPP for topic:',
            topic
          )
          dispatchAction!(
            {
              type: 'DAPPS_CONTROLLER_DISCONNECT_DAPP',
              params: { id: topic, url: '' }
            },
            undefined,
            true
          )
        }
      })

      // Store persisted sessions for later restoration once store is ready
      try {
        const activeSessions = walletKit.getActiveSessions()
        const sessionsToRestore = Object.values(activeSessions).map((session: any) => {
          const eip155Namespace = session.namespaces?.eip155
          const chainId = eip155Namespace?.chains?.[0]?.split(':')[1] || '1'
          const url = session.peer?.metadata?.url || 'https://walletconnect.com'
          return {
            topic: session.topic,
            url,
            chainId: parseInt(chainId, 10)
          }
        })
        if (sessionsToRestore.length > 0) {
          pendingRestoreSessions = sessionsToRestore
        }
      } catch (e) {
        console.error('[WalletConnect] Failed to get persisted sessions:', e)
      }

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

  const hasResult = 'result' in response
  const hasError = 'error' in response

  if (hasResult && hasError) {
    console.error('[WalletConnect] Invalid response: contains both result and error fields')
    await walletKit.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: {
          code: 5000,
          message: 'Invalid response format'
        }
      }
    })
    return
  }

  if (hasError) {
    const error = response.error
    let errorObj: { code: number; message: string; data?: any }

    if (
      error &&
      typeof error === 'object' &&
      'serialize' in error &&
      typeof error.serialize === 'function'
    ) {
      errorObj = error.serialize()
    } else if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      errorObj = {
        code: error.code,
        message: error.message,
        ...(error.data !== undefined && { data: error.data })
      }
    } else {
      errorObj = {
        code:
          error && typeof error === 'object' && 'code' in error && typeof error.code === 'number'
            ? error.code
            : 5000,
        message:
          error &&
          typeof error === 'object' &&
          'message' in error &&
          typeof error.message === 'string'
            ? error.message
            : error && typeof error.toString === 'function'
              ? error.toString()
              : 'Unknown error',
        ...(error &&
          typeof error === 'object' &&
          'data' in error &&
          error.data !== undefined && { data: error.data })
      }
    }

    // Send formatted error response to WalletConnect SDK
    await walletKit.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        error: errorObj
      }
    })
  } else {
    const result = response.result === undefined ? null : response.result

    await walletKit.respondSessionRequest({
      topic,
      response: {
        id,
        jsonrpc: '2.0',
        result
      }
    })
  }
}

export const approveWalletConnectSession = async (proposalId: number, accounts: string[]) => {
  if (!walletKit) return

  // Use the SDK's public API to retrieve pending proposals.
  // In the proposal store, fields like requiredNamespaces, optionalNamespaces,
  // and proposer are top-level (NOT nested under a .params property like in
  // the session_proposal event payload).
  const proposals = walletKit.getPendingSessionProposals()
  const proposal = Object.values(proposals).find((p: any) => p.id === proposalId)
  if (!proposal) {
    console.error('[WalletConnect] Proposal not found for id:', proposalId)
    return
  }

  const { id, requiredNamespaces, optionalNamespaces } = proposal

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
  const proposerUrl = proposal.proposer?.metadata?.url

  // Delegate session messenger setup to the webview — it will create the
  // dapp session and attach a wcBridgeMessenger that routes broadcast
  // events (disconnect, chainChanged, etc.) back to RN.
  dispatchAction!(
    {
      type: 'SETUP_WC_SESSION_MESSENGER',
      params: {
        url: proposerUrl,
        tabId: wcTabId,
        wcSessionTopic: session.topic,
        chainId: 1
      }
    },
    undefined,
    true
  )

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
    try {
      await walletKit.disconnectSession({
        topic: payload.wcSessionTopic,
        reason: getSdkError('USER_DISCONNECTED')
      })
    } catch (e: any) {
      // Session might already be deleted, that's ok
      if (e?.message?.includes('Record was recently deleted')) {
        // Session already deleted, ignore
      } else {
        throw e
      }
    }
    return
  }

  await walletKit.emitSessionEvent({
    topic: payload.wcSessionTopic,
    event: { name: payload.event, data: payload.data },
    chainId: `eip155:${payload.chainId}`
  })
}

export const disconnectSession = async (topic: string) => {
  if (!walletKit) {
    return
  }
  // Check if session exists in WalletKit
  const activeSessions = walletKit.getActiveSessions()
  const sessionExists = activeSessions[topic]
  if (!sessionExists) {
    return
  }
  try {
    await walletKit.disconnectSession({
      topic,
      reason: getSdkError('USER_DISCONNECTED')
    })
  } catch (e: any) {
    console.error('[WalletConnect] Failed to disconnect session:', topic, e?.message || e)
    throw e
  }
}

/**
 * Gets any pending sessions that need to be restored.
 * Call this once the store is ready, then dispatch RESTORE_WC_SESSIONS.
 */
export const getPendingRestoreSessions = () => {
  const sessions = pendingRestoreSessions
  pendingRestoreSessions = null
  return sessions
}
