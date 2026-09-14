import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'

export const SCAN_FRAME_SIZE = 280
const CORNER_LENGTH = 74
export const CORNER_RADIUS = 20
const CORNER_THICKNESS = 2

interface Style {
  scanFrame: ViewStyle
  corner: ViewStyle
  cornerTopLeft: ViewStyle
  cornerTopRight: ViewStyle
  cornerBottomLeft: ViewStyle
  cornerBottomRight: ViewStyle
}

const getStyles = (_theme: ThemeProps) =>
  StyleSheet.create<Style>({
    scanFrame: {
      width: SCAN_FRAME_SIZE,
      height: SCAN_FRAME_SIZE
    },
    corner: {
      position: 'absolute',
      width: CORNER_LENGTH,
      height: CORNER_LENGTH,
      borderColor: '#fff'
    },
    cornerTopLeft: {
      top: 0,
      left: 0,
      borderTopWidth: CORNER_THICKNESS,
      borderLeftWidth: CORNER_THICKNESS,
      borderTopLeftRadius: CORNER_RADIUS
    },
    cornerTopRight: {
      top: 0,
      right: 0,
      borderTopWidth: CORNER_THICKNESS,
      borderRightWidth: CORNER_THICKNESS,
      borderTopRightRadius: CORNER_RADIUS
    },
    cornerBottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: CORNER_THICKNESS,
      borderLeftWidth: CORNER_THICKNESS,
      borderBottomLeftRadius: CORNER_RADIUS
    },
    cornerBottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: CORNER_THICKNESS,
      borderRightWidth: CORNER_THICKNESS,
      borderBottomRightRadius: CORNER_RADIUS
    }
  })

export default getStyles
