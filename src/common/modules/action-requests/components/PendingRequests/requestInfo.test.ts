import type { Network } from '@ambire-common/interfaces/network'
import type { UserRequest } from '@ambire-common/interfaces/userRequest'
import i18n from '@common/config/localization'

import {
  getRequestDappInfo,
  getRequestDescription,
  getRequestNetworkLabel,
  getRequestTitle
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
})
