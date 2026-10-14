import { RelayerNetworkConfigResponse } from '@ambire-common/interfaces/network'
import { getBuildTimeNetworks } from '@benzin/contexts/benzinNetworksContext/helpers'

/**
 * The relayer network config, fetched once when benzin is built and inlined by
 * webpack (see webpack/relayerNetworks.js). Null when the build could not reach
 * the relayer, undefined in the extension and mobile bundles, which pull this
 * module in through the shared components but never inline the config.
 */
declare const __RELAYER_NETWORKS__: RelayerNetworkConfigResponse | null | undefined

const relayerNetworks =
  typeof __RELAYER_NETWORKS__ === 'undefined' ? undefined : __RELAYER_NETWORKS__

/**
 * The networks benzin ships with, resolved once from the relayer config that
 * webpack inlines at build time. The single source of networks for the whole app,
 * so the controllers and the screens never disagree on what a chain is called or
 * which RPC it uses.
 */
export const buildTimeNetworks = getBuildTimeNetworks(relayerNetworks)
