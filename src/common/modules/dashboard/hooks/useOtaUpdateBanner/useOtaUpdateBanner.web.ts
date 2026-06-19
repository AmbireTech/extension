import { Banner } from '@ambire-common/interfaces/banner'

const EMPTY_BANNERS: Banner[] = []

// OTA updates are mobile-only (Stallion); there is no update banner on web/extension.
// Stable empty reference so useBanners' memoization is not invalidated every render.
const useOtaUpdateBanner = (): Banner[] => EMPTY_BANNERS

export default useOtaUpdateBanner
