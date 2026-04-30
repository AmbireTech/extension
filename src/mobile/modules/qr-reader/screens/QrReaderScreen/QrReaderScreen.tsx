import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { Camera, useCameraDevice, useObjectOutput, isScannedCode } from 'react-native-vision-camera'
import { useNavigate } from 'react-router-native'

import LayoutWrapper from '@common/components/LayoutWrapper'
import { HeaderWithTitle } from '@common/modules/header/components/Header/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import spacing from '@common/styles/spacings'
import useTheme from '@common/hooks/useTheme'

const QrReaderScreen = () => {
  const { theme } = useTheme()
  const device = useCameraDevice('back')
  const navigate = useNavigate()

  const objectOutput = useObjectOutput({
    types: ['qr', 'ean-13'],
    onObjectsScanned: (objects) => {
      if (objects.length > 0) {
        // Just log the code value for now as requested
        const obj = objects[0]
        if (obj && isScannedCode(obj)) {
           console.log('Scanned code value:', obj.value)
        } else {
           console.log('Scanned object:', obj)
        }
        // Optionally navigate back after scan
        // navigate(-1)
      }
    }
  })

  if (device == null) {
    return (
      <LayoutWrapper>
        <HeaderWithTitle title="Scan QR Code" displayBackButtonIn="always" />
        <View style={[styles.container, spacing.paLg]}>
          <Text style={{ color: theme.secondaryText }}>Camera device not found.</Text>
        </View>
      </LayoutWrapper>
    )
  }

  return (
    <LayoutWrapper>
      <HeaderWithTitle title="Scan QR Code" displayBackButtonIn="always" />
      <View style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          outputs={[objectOutput]}
        />
        {/* Overlay here if needed */}
      </View>
    </LayoutWrapper>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})

export default QrReaderScreen
