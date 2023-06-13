import { JsonRpcProvider, WebSocketProvider } from 'ethers'

import CONFIG from '@common/config/env'
import networks, { NetworkId, NETWORKS, NetworkType } from '@common/constants/networks'

// @ts-ignore
const rpcProviders: { [key in NetworkId]: any } = {}

const setProvider = (_id: NetworkId) => {
  // eslint-disable-next-line no-underscore-dangle
  const url = CONFIG.RPC_URLS[_id]
  const network = networks.find(({ id }) => id === _id)
  if (!network) return null

  const { id: name, chainId, ensName } = network as NetworkType

  if (url?.startsWith('wss:')) {
    return new WebSocketProvider(url, {
      name: ensName || name,
      chainId
    })
  }
  return new JsonRpcProvider(url, {
    name: ensName || name,
    chainId
  })
}

if (!Object.keys(rpcProviders).length) {
  ;(Object.keys(NETWORKS) as Array<keyof typeof NETWORKS>).forEach((networkId: NetworkId) => {
    rpcProviders[networkId] = setProvider(networkId)
  })
}

export { rpcProviders }
