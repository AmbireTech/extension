import { networks as predefinedNetworks } from '@ambire-common/consts/networks'
import { Network, RelayerNetworkConfigResponse } from '@ambire-common/interfaces/network'
import { mapRelayerNetworkConfigToAmbireNetwork } from '@ambire-common/utils/networks'
import { logInfoWithPrefix, logWarnWithPrefix } from '@common/utils/logger'

const LOG_EVENT = 'networks'

/**
 * Converts the relayer network config that webpack inlines at build time into the
 * Ambire network format. Falls back to the networks predefined in ambire-common
 * when the build could not reach the relayer, in which case the config is null.
 */
export const getBuildTimeNetworks = (
  relayerNetworks: RelayerNetworkConfigResponse | null
): Network[] => {
  if (!relayerNetworks) {
    logWarnWithPrefix(
      LOG_EVENT,
      'The build could not reach the relayer, so only the networks predefined in ambire-common are available.',
      predefinedNetworks.map((network) => network.chainId.toString())
    )

    return predefinedNetworks
  }

  const networks = Object.values(relayerNetworks).map((relayerNetwork) =>
    mapRelayerNetworkConfigToAmbireNetwork(BigInt(relayerNetwork.chainId), relayerNetwork)
  )

  logInfoWithPrefix(
    LOG_EVENT,
    `Using the ${networks.length} networks the relayer served when this build was made.`,
    networks.map((network) => `${network.chainId.toString()} ${network.name}`)
  )

  return networks
}
