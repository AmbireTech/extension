import { Network } from '@ambire-common/interfaces/network'

const getBridgeNetworkNotSupportedReason = (
  network: Network,
  supportedChainIds: bigint[]
): string | null => {
  if (supportedChainIds.includes(network.chainId)) return null

  return `${network.name} network is not supported by our service provider.`
}

export { getBridgeNetworkNotSupportedReason }
