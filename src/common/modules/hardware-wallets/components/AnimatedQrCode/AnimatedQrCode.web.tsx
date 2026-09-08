import React from 'react'
import { View } from 'react-native'

import { AnimatedQRCode } from '@keystonehq/animated-qr'
import { SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { AnimatedQrCodeProps } from './AnimatedQrCode'

const DEFAULT_SIZE = 300
const DEFAULT_INTERVAL = 300
const DEFAULT_CAPACITY = 200
const QR_BACKGROUND_COLOR = '#fff'
/**
 * A larger-than-required white margin keeps the QR boundary distinct from dark surfaces.
 * This intentionally favors boundary detection over maximizing the module size.
 */
const DEFAULT_QUIET_ZONE = SPACING_XL
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
  const resolvedQuietZone = quietZone ?? DEFAULT_QUIET_ZONE
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
