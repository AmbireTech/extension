import type { Network } from '@ambire-common/interfaces/network'
import type { UserRequest } from '@ambire-common/interfaces/userRequest'
import { toBeHex } from 'ethers'

import type { TFunction } from 'i18next'

export const getUniquePreviewRequestsByIcon = (requests: UserRequest[]) => {
  const previewRequests: UserRequest[] = []
  const seenIcons = new Set<string>()

  for (const request of requests) {
    const icon = request.dappPromises[0]?.session.icon || ''
    if (seenIcons.has(icon)) continue

    seenIcons.add(icon)
    previewRequests.push(request)
  }

  return previewRequests
}

export const getRequestDappInfo = (request: UserRequest, t: TFunction) => {
  const session = request.dappPromises[0]?.session
  const label = session?.name || request.meta.dappName || session?.id || t('Unknown app')
  const url = request.meta.dappUrl || session?.id || session?.origin || label

  return {
    icon: session?.icon,
    label,
    url
  }
}

export const getRequestTitle = (request: UserRequest, t: TFunction) => {
  switch (request.kind) {
    case 'calls':
      return t('Sign transaction')
    case 'message':
    case 'typedMessage':
    case 'siwe':
    case 'authorization-7702':
      return t('Sign message')
    case 'switchAccount':
      return t('Switch account')
    case 'walletAddEthereumChain':
      return t('Add network')
    case 'dappConnect':
      return t('Connect app')
    case 'walletWatchAsset':
      return t('Add token')
    case 'ethGetEncryptionPublicKey':
      return t('Share encryption key')
    case 'ethDecrypt':
      return t('Decrypt message')
    case 'benzin':
      return t('View transaction')
    case 'swapAndBridge':
      return t('Swap and bridge')
    case 'transfer':
      return t('Send transaction')
    case 'unlock':
      return t('Unlock wallet')
    default:
      return t('Review request')
  }
}

export const getRequestDescription = (request: UserRequest, t: TFunction) => {
  const { label: appName } = getRequestDappInfo(request, t)

  switch (request.kind) {
    case 'calls':
      return t('{{appName}} wants you to approve a transaction.', { appName })
    case 'message':
    case 'typedMessage':
    case 'siwe':
    case 'authorization-7702':
      return t('{{appName}} wants you to sign a message.', { appName })
    case 'switchAccount':
      return t('{{appName}} wants to use a different account.', { appName })
    case 'walletAddEthereumChain':
      return t('{{appName}} wants to add a network.', { appName })
    case 'dappConnect':
      return t('{{appName}} wants to connect to your wallet.', { appName })
    case 'walletWatchAsset':
      return t('{{appName}} wants to add a token.', { appName })
    case 'ethGetEncryptionPublicKey':
      return t('{{appName}} wants your public encryption key.', { appName })
    case 'ethDecrypt':
      return t('{{appName}} wants you to decrypt a message.', { appName })
    default:
      return t('{{appName}} has a request waiting for you.', { appName })
  }
}

const getRequestChainId = (request: UserRequest) => {
  if (request.meta.chainId !== undefined && request.meta.chainId !== null) {
    return String(request.meta.chainId)
  }

  if (request.kind !== 'walletAddEthereumChain') return undefined

  const chainId = request.meta.params?.[0]?.chainId
  return chainId !== undefined && chainId !== null ? String(chainId) : undefined
}

export const getRequestNetworkLabel = (request: UserRequest, networks: Network[], t: TFunction) => {
  if (request.kind === 'walletAddEthereumChain') {
    const requestedNetworkName = request.meta.params?.[0]?.chainName
    if (requestedNetworkName) return requestedNetworkName
  }

  const requestChainId = getRequestChainId(request)
  if (!requestChainId) return t('Current network')

  const normalizedRequestChainId = requestChainId.toLowerCase()
  const network = networks.find(
    ({ chainId }) =>
      chainId.toString() === requestChainId ||
      toBeHex(chainId).toLowerCase() === normalizedRequestChainId
  )

  return network?.name || t('Unknown network')
}
