import useController from '@common/hooks/useController'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'

const selectAreNftImagesEnabled = (state: IFeatureFlagsController) => !!state.flags?.nftImages

/**
 * Whether the NFT images can be loaded. Loading them reveals the IP of the user and
 * the NFT to the image provider, so the user can opt out in the privacy settings
 */
const useAreNftImagesEnabled = () => {
  const { state: areNftImagesEnabled } = useController(
    'FeatureFlagsController',
    selectAreNftImagesEnabled
  )

  return areNftImagesEnabled
}

export default useAreNftImagesEnabled
