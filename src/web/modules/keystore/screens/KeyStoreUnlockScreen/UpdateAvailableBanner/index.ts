import type { AllControllersMappingType } from '@common/constants/controllersMapping'

import UpdateAvailableBanner from './UpdateAvailableBanner'

/** Whether the browser reported a newer extension version that is ready to be applied. */
export const selectIsExtensionUpdateAvailable = (
  state: AllControllersMappingType['ExtensionUpdateController']
): boolean => !!state.extensionUpdateBanner?.length

export { UPDATE_AVAILABLE_BANNER_HEIGHT } from './styles'
export default UpdateAvailableBanner
