import useController from '@common/hooks/useController'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'

const selectAreNftImagesEnabled = (state: IFeatureFlagsController) =>
  !!state.flags?.tokenAndDefiAutoDiscovery

/**
 * Whether the NFT images can be loaded. Loading them reveals the IP of the user and
 * the NFT to the image provider, so they follow the same privacy opt-out as the token
 * icons: Tokens, NFTs & DeFi positions auto discovery
 */
const useAreNftImagesEnabled = () => {
  const { state: areNftImagesEnabled } = useController(
    'FeatureFlagsController',
    selectAreNftImagesEnabled
  )

  return areNftImagesEnabled
}

export default useAreNftImagesEnabled
