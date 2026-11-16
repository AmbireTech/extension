import { ViewStyle } from 'react-native'

/** What the platform specific sheet props depend on. */
export type SheetPlatformOptions = {
  /** A modal sheet: a centered card in a wide web window, a bottom sheet elsewhere */
  isModal: boolean
  /** How far from the window's top a full height sheet stops on web */
  modalTopOffset: number
  /** The caller's sheet style, whose `maxWidth` sizes a centered card on web */
  style: ViewStyle
}
