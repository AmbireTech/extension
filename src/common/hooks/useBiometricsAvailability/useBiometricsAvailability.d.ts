import { BiometricsAvailability } from './types'

/**
 * The one answer to "can biometrics be offered here". Split per platform, because the two tell
 * genuinely different things about the device; screens used to re-derive it and drifted apart.
 */
declare const useBiometricsAvailability: () => BiometricsAvailability

export default useBiometricsAvailability
