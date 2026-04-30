import '@walletconnect/react-native-compat'

import { MainController } from '@ambire-common/controllers/main/main'
import CONFIG from '@common/config/env'
import { Action, MethodAction } from '@common/types/actions'
import { WalletKit } from '@reown/walletkit'
import { Core } from '@walletconnect/core'
import { getSdkError } from '@walletconnect/utils'

import { createWcMessenger } from './wcMessenger'

let walletKit: any = null
let mainCtrl: MainController | null = null
let initialized = false
let dispatchAction: ((action: MethodAction | Action) => void) | null = null

export const getWalletKit = () => walletKit

export const initWalletConnect = async (
  controller: MainController,
  dispatch: (action: MethodAction | Action) => void
) => {
  if (initialized) return walletKit

  mainCtrl = controller
  dispatchAction = dispatch

  const core = new Core({ projectId: CONFIG.WALLETCONNECT_PROJECT_ID })

  walletKit = await WalletKit.init({
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
  })

  walletKit.on('session_proposal', async (proposal: any) => {
    try {
      const { id, params } = proposal
      const proposerUrl = params.proposer.metadata.url
      const wcTabId = id.toString()

      const session = await mainCtrl!.dapps.getOrCreateDappSession({
        url: proposerUrl,
        tabId: wcTabId
      })

      // We translate this into a dapp_connect request which invokes DappConnectScreen
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
      const { request, chainId } = params

      // We get the session to find the origin URL
      const activeSession = walletKit.engine.signClient.session.get(topic)
      const proposerUrl = activeSession?.peer?.metadata?.url

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
  return walletKit
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
  const dappSession = await mainCtrl!.dapps.getOrCreateDappSession({
    url: proposerUrl,
    tabId: wcTabId
  })
  mainCtrl!.dapps.setSessionMessenger(
    dappSession.sessionId,
    createWcMessenger(walletKit, session.topic, 1),
    false
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
