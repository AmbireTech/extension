import { isiOS } from '@common/config/env'

/**
 * The size of the round buttons in a sheet's header, as the system's own: 44pt on iOS and
 * the 40dp of a Material icon button on Android. The title keeps clear of them.
 */
export const SHEET_HEADER_BUTTON_SIZE = isiOS ? 44 : 40
