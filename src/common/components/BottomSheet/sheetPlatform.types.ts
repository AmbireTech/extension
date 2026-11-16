import { ViewStyle } from 'react-native'

import { SPACING_MD } from '@common/styles/spacings'

/** The gap a full height sheet leaves above it, so the backdrop shows it's a sheet. */
export const SHEET_TOP_GAP = SPACING_MD

/** What the platform specific sheet props depend on. */
export type SheetPlatformOptions = {
  /** A modal sheet: a centered card in a wide web window, a bottom sheet elsewhere */
  isModal: boolean
  /** How far from the window's top a full height sheet stops on web */
  modalTopOffset: number
  /** The caller's sheet style, whose `maxWidth` sizes a centered card on web */
  style: ViewStyle
}
