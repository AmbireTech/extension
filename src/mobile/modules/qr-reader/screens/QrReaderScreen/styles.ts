import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'

const SCAN_FRAME_SIZE = 280
const CORNER_LENGTH = 56
const CORNER_RADIUS = 32
const CORNER_THICKNESS = 6
const HEADER_ICON_HIT = 32

interface Style {
  root: ViewStyle
  dimMask: ViewStyle
  headerSideSlot: ViewStyle
  scanFrame: ViewStyle
  corner: ViewStyle
  cornerTopLeft: ViewStyle
  cornerTopRight: ViewStyle
  cornerBottomLeft: ViewStyle
  cornerBottomRight: ViewStyle
}

const getStyles = (_theme: ThemeProps) =>
  StyleSheet.create<Style>({
    root: {
      flex: 1,
      backgroundColor: '#000'
    },
    dimMask: {
      backgroundColor: 'rgba(0, 0, 0, 0.25)'
    },
    headerSideSlot: {
      width: HEADER_ICON_HIT,
      height: HEADER_ICON_HIT,
      justifyContent: 'center'
    },
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
