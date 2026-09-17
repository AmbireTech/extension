import { BiometricsAvailability } from './types'

/**
 * The one answer to "can biometrics be offered here". Split per platform, because the two can
 * genuinely tell different things about the device, and screens used to each re-derive it from
 * the raw context - which is how they drifted apart.
 */
declare const useBiometricsAvailability: () => BiometricsAvailability

export default useBiometricsAvailability
