import React from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { Camera, isScannedCode, useCameraDevice, useObjectOutput } from 'react-native-vision-camera'

import EditPenIcon from '@common/assets/svg/EditPenIcon'
import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

const GalleryIcon = ({ color = '#fff', size = 26 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth={1.8} />
    <Circle cx="15.5" cy="8.5" r="1.6" stroke={color} strokeWidth={1.8} />
    <Path
      d="M3.5 17l4.5-4.5a2 2 0 0 1 2.83 0L20.5 21"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)

const QrReaderScreen = () => {
  const { theme } = useTheme()
  const styles = getStyles(theme)
  const { goBack } = useNavigation()
  const device = useCameraDevice('back')

  const ScanFrame = () => (
    <View style={styles.scanFrame} pointerEvents="none">
      <View style={[styles.corner, styles.cornerTopLeft]} />
      <View style={[styles.corner, styles.cornerTopRight]} />
      <View style={[styles.corner, styles.cornerBottomLeft]} />
      <View style={[styles.corner, styles.cornerBottomRight]} />
    </View>
  )

  const objectOutput = useObjectOutput({
    types: ['qr', 'ean-13'],
    onObjectsScanned: (objects) => {
      if (!objects.length) return
      const obj = objects[0]
      if (obj && isScannedCode(obj)) {
        console.log('Scanned code value:', obj.value)
      } else {
        console.log('Scanned object:', obj)
      }
    }
  })

  const handleEnterManually = () => {
    console.log('Enter code manually pressed')
  }

  const handleGalleryPress = () => {
    console.log('Open gallery pressed')
  }

  const header = (
    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
      <Pressable onPress={goBack} hitSlop={12} style={[styles.headerSideSlot, flexbox.alignStart]}>
        <LeftArrowIcon color="#fff" width={11} height={20} />
      </Pressable>
      <Text
        fontSize={18}
        weight="medium"
        color="#fff"
        numberOfLines={1}
        style={[flexbox.flex1, { textAlign: 'center' }]}
      >
        Scan QR code
      </Text>
      <Pressable
        onPress={handleGalleryPress}
        hitSlop={12}
        style={[styles.headerSideSlot, flexbox.alignEnd]}
      >
        <GalleryIcon />
      </Pressable>
    </View>
  )

  const footer = (
    <Pressable
      onPress={handleEnterManually}
      hitSlop={8}
      style={[flexbox.directionRow, flexbox.center, spacings.pvLg]}
    >
      <EditPenIcon color={theme.successDecorative} width={20} height={20} />
      <Text fontSize={16} weight="medium" color="#fff" style={spacings.mlSm}>
        Enter code manually
      </Text>
    </Pressable>
  )

  return (
    <View style={styles.root}>
      {device != null && (
        <Camera style={StyleSheet.absoluteFill} device={device} isActive outputs={[objectOutput]} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.dimMask]} pointerEvents="none" />
      <MobileLayoutContainer backgroundColor="transparent" header={header} footer={footer}>
        <View style={[flexbox.flex1, flexbox.center]}>
          <ScanFrame />
        </View>
      </MobileLayoutContainer>
      {device == null && (
        <View style={[StyleSheet.absoluteFill, flexbox.center]} pointerEvents="none">
          <Text color="#fff">Camera device not found.</Text>
        </View>
      )}
    </View>
  )
}

export default QrReaderScreen
