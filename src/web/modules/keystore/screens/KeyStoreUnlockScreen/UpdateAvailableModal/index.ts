import type { AllControllersMappingType } from '@common/constants/controllersMapping'

import UpdateAvailableModal from './UpdateAvailableModal'

/** Whether the browser reported a newer extension version that is ready to be applied. */
export const selectIsExtensionUpdateAvailable = (
  state: AllControllersMappingType['ExtensionUpdateController']
): boolean => !!state.extensionUpdateBanner?.length

export default UpdateAvailableModal
