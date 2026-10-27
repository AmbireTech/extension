import useController from '@common/hooks/useController'

import type { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'

export type NftImagesStatus = 'loading' | 'enabled' | 'disabled'

const selectNftImagesStatus = (state: IFeatureFlagsController): NftImagesStatus => {
  // Until the saved flags are loaded the flag holds only its default, which the user
  // may have changed, so no image is requested before then
  if (!state.isReady) return 'loading'

  return state.flags?.nftImages ? 'enabled' : 'disabled'
}

/**
 * Whether the NFT images can be loaded. Loading them reveals the IP of the user and
 * the NFT to the image provider, so only `enabled` allows it
 */
const useNftImagesStatus = (): NftImagesStatus => {
  const { state: status } = useController('FeatureFlagsController', selectNftImagesStatus)

  return status
}

export default useNftImagesStatus
