import '@walletconnect/react-native-compat'

import CONFIG from '@common/config/env'
import { Action, MethodAction } from '@common/types/actions'
import { getWcTabIdFromTopic } from '@mobile/modules/wallet-connect/utils'
import { WalletKit, WalletKitTypes } from '@reown/walletkit'
import { Core } from '@walletconnect/core'
import { pino } from '@walletconnect/logger'
import { ProposalTypes, SessionTypes } from '@walletconnect/types'
import { getSdkError } from '@walletconnect/utils'

type WalletKitType = InstanceType<typeof WalletKit>
type DispatchFn = (action: MethodAction | Action, windowId?: number, raw?: boolean) => void

let walletKit: WalletKitType | null = null
let initialized = false
let initPromise: Promise<WalletKitType> | null = null
let addToastFn: ((text: string, options?: any) => void) | null = null
let pendingRestoreSessions:
  | { topic: string; url: string; chainId: number; name?: string; icon?: string }[]
  | null = null

// Keyed by the session_authenticate request id.
const pendingAuthenticates = new Map<
  number,
  { authPayload: any; requesterUrl: string; iss?: string }
>()

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

const getDappMetadata = async (url: string, name?: string, icon?: string) => {
  let finalName = name || ''
  let finalIcon = icon || ''

  const fetchedName = await fetchDappName(url)
  if (fetchedName) {
    finalName = fetchedName
  } else if (!finalName || finalName === 'Signature Validator') {
    try {
      finalName = new URL(url).hostname
    } catch (e) {
      // ignore
    }
  }

  if (finalIcon) {
    try {
      finalIcon = new URL(finalIcon, url).href
    } catch (e) {
      // ignore invalid url
    }
  }

  return { name: finalName, icon: finalIcon }
}

export const initWalletConnect = async (
  dispatch: (action: MethodAction | Action, windowId?: number, raw?: boolean) => void,
  addToast: (text: string, options?: any) => void
) => {
  if (initialized) {
    console.log('[WalletConnect] Already initialized, returning existing walletKit.')
    return walletKit
  }

  if (initPromise) {
    console.log('[WalletConnect] Initialization already in progress, waiting for existing promise.')
    return initPromise
  }

  addToastFn = addToast

  initPromise = (async () => {
    try {
      console.log('[WalletConnect] Initialization started...')

      if (!CONFIG.WALLETCONNECT_PROJECT_ID) {
        throw new Error('WALLETCONNECT_PROJECT_ID is missing from configuration.')
      }

      console.log('[WalletConnect] Creating Core instance...')
      // getDefaultLoggerOptions() hardcodes level:'info' and ignores the string arg,
      // so passing logger:'silent' to Core does nothing. Pass a real pino instance.
      const core = new Core({
        projectId: CONFIG.WALLETCONNECT_PROJECT_ID,
        logger: pino({ level: 'silent' })
      })

      console.log('[WalletConnect] Initializing WalletKit...')
      // We add a timeout to prevent indefinite hanging if the relay is unreachable
      const initResult = await Promise.race([
        WalletKit.init({
          core,
          metadata: {
            name: 'Ambire Wallet',
            description: 'Your Web3 Wallet that just works.',
            url: 'https://ambire.com/',
            icons: ['https://ambire.com/wallet-logo.png'],
            redirect: {
              native: 'ambire://wc',
              universal: 'https://ambire.com/wc'
            }
          }
        }),
        new Promise<WalletKitType>((_, reject) =>
          setTimeout(() => reject(new Error('WalletKit initialization timed out (15s)')), 15000)
        )
      ])

      walletKit = initResult
      console.log('[WalletConnect] WalletKit initialized successfully.')

      // WalletKit calls SignClient.init({core, metadata, signConfig}) WITHOUT passing
      // the logger, so SignClient builds its own pino logger at level 'error', ignoring
      // the silent logger we passed to Core. Re-silence each downstream logger directly.
      try {
        const sc: any = (walletKit as any).engine?.signClient
        if (sc?.logger) sc.logger.level = 'silent'
        if (sc?.core?.relayer?.logger) sc.core.relayer.logger.level = 'silent'
        if ((walletKit as any).logger) (walletKit as any).logger.level = 'silent'
      } catch (e) {
        console.warn('[WalletConnect] Failed to silence downstream loggers:', e)
      }

      walletKit.on('session_proposal', async (proposal: WalletKitTypes.SessionProposal) => {
        try {
          const { id, params } = proposal
          const proposerUrl = params.proposer.metadata.url

          const { name, icon } = await getDappMetadata(
            proposerUrl,
            params.proposer.metadata.name,
            params.proposer.metadata.icons[0]
          )

          dispatch(
            {
              type: 'HANDLE_PROVIDER_REQUEST',
              params: {
                request: {
                  method: 'tabCheckin',
                  origin: proposerUrl,
                  params: { name, icon }
                },
                requestId: 0,
                providerId: 1,
                topic: `temp_wallet_connect_session_${proposal.id}`,
                tabId: proposal.id,
                isWalletConnect: true
              }
            },
            undefined,
            true
          )

          dispatch(
            {
              type: 'HANDLE_PROVIDER_REQUEST',
              params: {
                request: { method: 'eth_requestAccounts', origin: proposerUrl },
                requestId: id,
                providerId: 1, // Single provider id for WC for now
                topic: `temp_wallet_connect_session_${proposal.id}`,
                tabId: proposal.id,
                isWalletConnect: true
              }
            },
            undefined,
            true
          )
        } catch (e) {
          console.error(e)
        }
      })

      walletKit.on('session_request', async (requestEvent: WalletKitTypes.SessionRequest) => {
        try {
          const { topic, params, id } = requestEvent
          const { request } = params

          // We get the session to find the origin URL
          const activeSession = walletKit?.engine.signClient.session.get(topic)
          if (!activeSession || !activeSession.peer?.metadata?.url) {
            addToast('WalletConnect session not found. Please reconnect the app.', {
              type: 'error'
            })
            return
          }
          const proposerUrl = activeSession.peer.metadata.url

          dispatch(
            {
              type: 'HANDLE_PROVIDER_REQUEST',
              params: {
                request: { ...request, origin: proposerUrl },
                requestId: id,
                providerId: 1,
                topic,
                tabId: getWcTabIdFromTopic(topic),
                isWalletConnect: true
              }
            },
            undefined,
            true
          )
        } catch (e) {
          console.error(e)
        }
      })

      walletKit.on('session_delete', (event: WalletKitTypes.SessionDelete) => {
        dispatch({
          type: 'method',
          params: {
            method: 'deleteDappSessionByWcTopic',
            ctrlName: 'DappsController',
            args: [event.topic]
          }
        })
      })

      walletKit.on('session_authenticate', async (event: WalletKitTypes.SessionAuthenticate) => {
        try {
          const { id, params: authParams } = event
          const { authPayload, requester } = authParams
          const proposerUrl = requester.metadata.url

          const { name, icon } = await getDappMetadata(
            proposerUrl,
            requester.metadata.name,
            requester.metadata.icons[0]
          )

          pendingAuthenticates.set(id, { authPayload, requesterUrl: proposerUrl })

          dispatch(
            {
              type: 'HANDLE_PROVIDER_REQUEST',
              params: {
                request: { method: 'tabCheckin', origin: proposerUrl, params: { name, icon } },
                requestId: 0,
                providerId: 1,
                topic: `temp_wc_auth_${id}`,
                tabId: id,
                isWalletConnect: true,
                isWcAuthenticate: true
              }
            },
            undefined,
            true
          )

          dispatch(
            {
              type: 'HANDLE_PROVIDER_REQUEST',
              params: {
                request: { method: 'eth_requestAccounts', origin: proposerUrl },
                requestId: id,
                providerId: 1,
                topic: `temp_wc_auth_${id}`,
                tabId: id,
                isWalletConnect: true,
                isWcAuthenticate: true
              }
            },
            undefined,
            true
          )
        } catch (e) {
          console.error('[WalletConnect] session_authenticate handler error:', e)
        }
      })

      walletKit.on('proposal_expire', ({ id }: WalletKitTypes.ProposalExpire) => {
        dispatch({
          type: 'method',
          params: {
            method: 'deleteDappSessionByWcTopic',
            ctrlName: 'DappsController',
            args: [`temp_wallet_connect_session_${id}`]
          }
        })
        addToast('WalletConnect connection request expired.', { type: 'error' })
      })

      walletKit.on('session_request_expire', ({ id }: WalletKitTypes.SessionRequestExpire) => {
        addToast('WalletConnect request expired. Please retry in the dApp.', { type: 'error' })
        console.warn('[WalletConnect] session_request_expire for request id:', id)
      })

      // Store persisted sessions for later restoration once store is ready
      try {
        const activeSessions = walletKit.getActiveSessions()
        const sessionsToRestore = await Promise.all(
          Object.values(activeSessions).map(async (session: SessionTypes.Struct) => {
            const eip155Namespace = session.namespaces?.eip155
            const chainId = eip155Namespace?.chains?.[0]?.split(':')[1] || '1'
            const url = session.peer.metadata.url
            const { name, icon } = await getDappMetadata(
              url,
              session.peer.metadata.name,
              session.peer.metadata.icons[0]
            )
            return {
              topic: session.topic,
              url,
              chainId: parseInt(chainId, 10),
              name,
              icon
            }
          })
        )
        if (sessionsToRestore.length > 0) pendingRestoreSessions = sessionsToRestore
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

export const approveWalletConnectSession = async (
  proposalId: number,
  accounts: string[],
  dispatch: DispatchFn
) => {
  if (!walletKit) return

  // Use the SDK's public API to retrieve pending proposals.
  // In the proposal store, fields like requiredNamespaces, optionalNamespaces,
  // and proposer are top-level (NOT nested under a .params property like in
  // the session_proposal event payload).
  const proposals = walletKit.getPendingSessionProposals()
  const proposal = Object.values(proposals).find((p: ProposalTypes.Struct) => p.id === proposalId)
  if (!proposal) {
    console.error('[WalletConnect] Proposal not found. Please try to reconnect the dApp.')
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

  const session = await walletKit.approveSession({ id, namespaces })

  const proposerUrl = proposal.proposer?.metadata?.url || ''
  const { name, icon } = await getDappMetadata(
    proposerUrl,
    proposal.proposer?.metadata?.name,
    proposal.proposer?.metadata?.icons?.[0]
  )

  dispatch(
    {
      type: 'SETUP_WC_SESSION_MESSENGER',
      params: {
        url: proposerUrl,
        tabId: getWcTabIdFromTopic(session.topic),
        topic: session.topic,
        chainId: 1,
        name,
        icon,
        tempSessionTopic: `temp_wallet_connect_session_${proposal.id}`
      }
    },
    undefined,
    true
  )

  addToastFn?.('Connected! You can return to the browser.', { type: 'success' })

  return session
}

export const rejectWalletConnectSession = async (proposalId: number) => {
  if (!walletKit) return

  await walletKit.rejectSession({ id: proposalId, reason: getSdkError('USER_REJECTED') })
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

  if (payload.event === 'accountsChanged' || payload.event === 'chainChanged') {
    try {
      const activeSession = walletKit.engine.signClient.session.get(payload.wcSessionTopic)
      if (activeSession) {
        const namespaces = activeSession.namespaces
        if (namespaces.eip155) {
          let newAccounts = namespaces.eip155.accounts

          if (payload.event === 'accountsChanged') {
            const chains = namespaces.eip155.chains || [`eip155:${payload.chainId}`]
            newAccounts = chains
              .map((c: string) => payload.data.map((a: string) => `${c}:${a}`))
              .flat()
          } else if (payload.event === 'chainChanged') {
            // For chainChanged, we should ideally ensure the new chain is in the chains list
            // but the essential part is making sure the current account is mapped to the new chain
            const newChain =
              typeof payload.data === 'object' && payload.data.chain
                ? parseInt(payload.data.chain, 16).toString()
                : parseInt(payload.data, 16).toString()

            const currentAddresses = newAccounts
              .map((acc: string) => acc.split(':')[2])
              .filter((addr: string | undefined): addr is string => !!addr)
            const uniqueAddresses = [...new Set(currentAddresses)]

            const chains = namespaces.eip155.chains || []
            if (!chains.includes(`eip155:${newChain}`)) {
              chains.push(`eip155:${newChain}`)
            }

            newAccounts = chains
              .map((c: string) => uniqueAddresses.map((a: string) => `${c}:${a}`))
              .flat()
            namespaces.eip155.chains = chains
          }

          const newNamespaces = {
            ...namespaces,
            eip155: {
              ...namespaces.eip155,
              accounts: newAccounts
            }
          }

          await walletKit.updateSession({
            topic: payload.wcSessionTopic,
            namespaces: newNamespaces
          })
          console.log('[WalletConnect] Successfully updated session namespaces for', payload.event)
        }
      }
    } catch (e: any) {
      console.warn('[WalletConnect] Failed to update session namespaces:', e)
    }
  }

  try {
    await walletKit.emitSessionEvent({
      topic: payload.wcSessionTopic,
      event: { name: payload.event, data: payload.data },
      chainId: `eip155:${payload.chainId}`
    })
  } catch (e: any) {
    if (e?.message?.includes('Record was recently deleted')) {
      console.log(
        '[WalletConnect] Ignored emitSessionEvent on deleted session:',
        payload.wcSessionTopic
      )
    } else {
      throw e
    }
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

/**
 * Called after the user selects an account in the session_authenticate flow.
 * Formats the SIWE message and dispatches it as personal_sign so the existing
 * SIWE detection, UI, and signing path handle it unchanged.
 */
export const prepareWcAuthenticate = async (id: number, address: string, dispatch: DispatchFn) => {
  if (!walletKit) return

  const pending = pendingAuthenticates.get(id)
  if (!pending) {
    console.error('[WalletConnect] prepareWcAuthenticate: no pending auth for id', id)
    return
  }

  const { authPayload, requesterUrl } = pending

  // Pick the first chain from the auth payload (e.g. 'eip155:1')
  const chainCaip: string = authPayload.chains?.[0] ?? 'eip155:1'
  const iss = `did:pkh:${chainCaip}:${address}`
  const message: string = walletKit.formatAuthMessage({ request: authPayload, iss })

  // Store iss so approveWcAuthenticate can include it in the CACAO payload
  pendingAuthenticates.set(id, { ...pending, iss })

  // Hex-encode for personal_sign — getParsedSiweMessage handles both hex and plain text
  const hexMessage = `0x${Array.from(new TextEncoder().encode(message))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`

  // Reuse the temp topic so rpcFlow finds the session with an account already bound.
  // id + 1 avoids the per-session deduplication guard (eth_requestAccounts consumed slot `id`).
  dispatch(
    {
      type: 'HANDLE_PROVIDER_REQUEST',
      params: {
        request: {
          method: 'personal_sign',
          origin: requesterUrl,
          params: [hexMessage, address]
        },
        requestId: id + 1,
        providerId: 1,
        topic: `temp_wc_auth_${id}`,
        tabId: id,
        isWalletConnect: true,
        isWcAuthenticate: true
      }
    },
    undefined,
    true
  )
}

/**
 * Builds the CACAO and approves the session_authenticate request.
 * If WalletKit creates a persistent session as a result, the session messenger
 * is set up so future session_requests are routed correctly.
 */
export const approveWcAuthenticate = async (
  id: number,
  signature: string,
  dispatch: DispatchFn
) => {
  if (!walletKit) return

  const pending = pendingAuthenticates.get(id)
  if (!pending) {
    console.error('[WalletConnect] approveWcAuthenticate: no pending auth for id', id)
    return
  }

  const { authPayload, requesterUrl, iss } = pending

  if (!iss) {
    // iss is set by prepareWcAuthenticate after account selection. If it's missing,
    // this is a stale entry from a previous failed flow — reject and clean up.
    console.error('[WalletConnect] approveWcAuthenticate: iss not set, rejecting')
    await walletKit.rejectSessionAuthenticate({ id, reason: getSdkError('USER_REJECTED') })
    pendingAuthenticates.delete(id)
    return
  }

  const result = await walletKit.approveSessionAuthenticate({
    id,
    // iss is the did:pkh DID of the signing account, set in prepareWcAuthenticate.
    auths: [{ h: { t: 'caip122' }, p: { ...authPayload, iss }, s: { t: 'eip191', s: signature } }]
  })

  pendingAuthenticates.delete(id)

  // If WalletKit established a persistent session, wire up the messenger
  const session = (result as any)?.session as SessionTypes.Struct | undefined
  if (session) {
    const { name, icon } = await getDappMetadata(
      requesterUrl,
      session.peer.metadata.name,
      session.peer.metadata.icons[0]
    )
    dispatch(
      {
        type: 'SETUP_WC_SESSION_MESSENGER',
        params: {
          url: requesterUrl,
          tabId: getWcTabIdFromTopic(session.topic),
          topic: session.topic,
          chainId: 1,
          name,
          icon,
          tempSessionTopic: `temp_wc_auth_${id}`
        }
      },
      undefined,
      true
    )
  }
}

export const rejectWcAuthenticate = async (id: number) => {
  if (!walletKit) return
  await walletKit.rejectSessionAuthenticate({ id, reason: getSdkError('USER_REJECTED') })
  pendingAuthenticates.delete(id)
}
