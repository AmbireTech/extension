import type { Network } from '@ambire-common/interfaces/network'
import type { UserRequest } from '@ambire-common/interfaces/userRequest'
import i18n from '@common/config/localization'

import {
  getIsAmbireWalletRequest,
  getIsSafeRequest,
  getRequestDappInfo,
  getRequestDescription,
  getRequestNetworkLabel,
  getRequestTitle,
  getUniquePreviewRequestsByIcon
} from './requestInfo'

const networks = [{ chainId: 8453n, name: 'Base' }] as Network[]

const buildRequest = (kind: UserRequest['kind'], meta: Record<string, any> = {}): UserRequest =>
  ({
    id: `${kind}-request`,
    kind,
    meta,
    dappPromises: [
      {
        session: {
          name: 'Uniswap',
          id: 'app.uniswap.org',
          origin: 'https://app.uniswap.org',
          icon: 'https://app.uniswap.org/icon.png'
        }
      }
    ]
  }) as UserRequest

describe('pending request information', () => {
  test('describes a transaction request with its app and network', () => {
    const request = buildRequest('calls', { chainId: 8453n })

    expect(getRequestTitle(request, i18n.t)).toBe('Sign transaction')
    expect(getRequestDescription(request, i18n.t)).toBe(
      'Uniswap wants you to approve a transaction.'
    )
    expect(getRequestNetworkLabel(request, networks, i18n.t)).toBe('Base')
    expect(getRequestDappInfo(request, i18n.t)).toMatchObject({
      label: 'Uniswap',
      url: 'app.uniswap.org'
    })
  })

  test('identifies and describes an Ambire wallet transaction', () => {
    const request = buildRequest('calls', { chainId: 8453n })
    request.dappPromises = []

    expect(getIsAmbireWalletRequest(request)).toBe(true)
    expect(getRequestTitle(request, i18n.t)).toBe('Sign transaction')
    expect(getRequestDescription(request, i18n.t)).toBe('Transaction created in Ambire Wallet.')
    expect(getRequestDappInfo(request, i18n.t)).toMatchObject({
      label: 'Ambire Wallet',
      url: 'Ambire Wallet'
    })
  })

  test('identifies and describes an Ambire swap and bridge request', () => {
    const request = buildRequest('calls', { chainId: 8453n })
    Object.assign(request, {
      signAccountOp: { accountOp: { meta: { swapTxn: {} } } }
    })

    expect(getIsAmbireWalletRequest(request)).toBe(true)
    expect(getRequestTitle(request, i18n.t)).toBe('Swap and bridge')
    expect(getRequestDescription(request, i18n.t)).toBe(
      'Swap and bridge request created in Ambire Wallet.'
    )
  })

  test('keeps Ambire, Safe and fallback icons separate in the preview', () => {
    const ambireRequest = buildRequest('calls', { chainId: 8453n })
    Object.assign(ambireRequest, {
      signAccountOp: { accountOp: { meta: { swapTxn: {} } } }
    })
    const safeRequest = buildRequest('calls', { safeTxnProps: { txnId: '0x1' } })
    safeRequest.dappPromises = []
    const fallbackRequest = buildRequest('message')
    fallbackRequest.dappPromises = []

    expect(getUniquePreviewRequestsByIcon([ambireRequest, safeRequest, fallbackRequest])).toEqual([
      ambireRequest,
      safeRequest,
      fallbackRequest
    ])
  })

  test('identifies and describes a Safe API transaction', () => {
    const request = buildRequest('calls', { safeTxnProps: { txnId: '0x1' } })
    request.dappPromises = []

    expect(getIsSafeRequest(request)).toBe(true)
    expect(getIsAmbireWalletRequest(request)).toBe(false)
    expect(getRequestDescription(request, i18n.t)).toBe(
      'This transaction was proposed in Safe and is waiting for your signature.'
    )
    expect(getRequestDappInfo(request, i18n.t)).toMatchObject({
      label: 'Safe',
      url: 'Safe'
    })
  })

  test('identifies Safe transaction metadata after requests are merged', () => {
    const request = buildRequest('calls')
    Object.assign(request, {
      signAccountOp: { accountOp: { meta: {}, safeTx: {} } }
    })

    expect(getIsSafeRequest(request)).toBe(true)
  })

  test('identifies and describes a Safe API message', () => {
    const request = buildRequest('typedMessage', {
      keepRequestAlive: true,
      created: 123,
      hash: '0x1',
      signatures: []
    })
    request.dappPromises = []

    expect(getIsSafeRequest(request)).toBe(true)
    expect(getRequestDescription(request, i18n.t)).toBe(
      'This message was proposed in Safe and is waiting for your signature.'
    )
  })

  test('uses the requested name for a network that is being added', () => {
    const request = buildRequest('walletAddEthereumChain', {
      params: [{ chainId: '0x2105', chainName: 'Base' }]
    })

    expect(getRequestTitle(request, i18n.t)).toBe('Add network')
    expect(getRequestNetworkLabel(request, [], i18n.t)).toBe('Base')
  })

  test('uses the current network when the request has no chain', () => {
    const request = buildRequest('switchAccount')

    expect(getRequestTitle(request, i18n.t)).toBe('Switch account')
    expect(getRequestNetworkLabel(request, networks, i18n.t)).toBe('Current network')
  })

  test('keeps the first request for each icon in the preview', () => {
    const firstRequest = buildRequest('calls')
    const duplicateIconRequest = buildRequest('message')
    const secondRequest = buildRequest('switchAccount')
    secondRequest.dappPromises[0]!.session.icon = 'https://safe.global/icon.png'

    expect(
      getUniquePreviewRequestsByIcon([firstRequest, duplicateIconRequest, secondRequest])
    ).toEqual([firstRequest, secondRequest])
  })
})
