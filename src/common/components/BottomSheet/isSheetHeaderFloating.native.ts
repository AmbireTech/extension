import { isLiquidGlassAvailable } from 'expo-glass-effect'

import { isiOS } from '@common/config/env'

/**
 * Whether a sheet's header floats over its content, frosting what scrolls under it, as the
 * system's own sheets do. iOS 26 on, the same releases as Liquid Glass; elsewhere the
 * header is solid and the content starts below it.
 */
const IS_SHEET_HEADER_FLOATING = isiOS && isLiquidGlassAvailable()

export default IS_SHEET_HEADER_FLOATING
