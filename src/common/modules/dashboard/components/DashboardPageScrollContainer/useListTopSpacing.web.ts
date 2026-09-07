import spacings from '@common/styles/spacings'

import useBanners from '../../hooks/useBanners'

/** Separates the list from the banners rendered as its header. */
const useListTopSpacing = () => {
  const [controllerBanners] = useBanners()

  return controllerBanners.length ? spacings.ptTy : spacings.pt0
}

export default useListTopSpacing
