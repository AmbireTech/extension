import React from 'react'
import { View } from 'react-native'

import { AnimatedQRCode } from '@keystonehq/animated-qr'
import flexbox from '@common/styles/utils/flexbox'

import { AnimatedQrCodeProps } from './AnimatedQrCode'

const DEFAULT_SIZE = 300
const DEFAULT_INTERVAL = 300
const DEFAULT_CAPACITY = 200
const QR_BACKGROUND_COLOR = '#fff'
/**
 * Accounts sync uses version 8 (49x49 modules), while the default-capacity signing QR
 * codes are denser. Reserving four modules at version 8 therefore gives every web QR
 * using the default margin enough white space to stand apart from a dark surface.
 */
const SMALLEST_EXPECTED_QR_MODULE_COUNT = 49
const REQUIRED_QUIET_ZONE_MODULES = 4
const DEFAULT_QUIET_ZONE_RATIO =
  REQUIRED_QUIET_ZONE_MODULES /
  (SMALLEST_EXPECTED_QR_MODULE_COUNT + REQUIRED_QUIET_ZONE_MODULES * 2)
// AnimatedQRCode already paints this much white on every side of the code
const BUILT_IN_QUIET_ZONE = 5

// Web renders the animated QR through @keystonehq/animated-qr, which relies on
// qrcode.react (browser canvas) and is therefore web-only. The native variant
// generates the same UR fragments with @ngraveio/bc-ur + react-native-qrcode-svg.
const AnimatedQrCode = ({
  type,
  cbor,
  size = DEFAULT_SIZE,
  interval = DEFAULT_INTERVAL,
  capacity = DEFAULT_CAPACITY,
  quietZone
}: AnimatedQrCodeProps) => {
  const resolvedQuietZone = quietZone ?? Math.ceil(size * DEFAULT_QUIET_ZONE_RATIO)
  // Tops the library's built-in white space up to the requested quiet zone.
  const padding = Math.max(0, resolvedQuietZone - BUILT_IN_QUIET_ZONE)

  return (
    <View
      style={[
        flexbox.center,
        { padding, width: size, height: size, backgroundColor: QR_BACKGROUND_COLOR }
      ]}
    >
      <AnimatedQRCode
        options={{
          capacity,
          interval,
          size: size - padding * 2
        }}
        type={type}
        cbor={cbor}
      />
    </View>
  )
}

export default React.memo(AnimatedQrCode)
