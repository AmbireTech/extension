import React from 'react'
import { View } from 'react-native'

import { AnimatedQRCode } from '@keystonehq/animated-qr'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { AnimatedQrCodeProps } from './AnimatedQrCode'

const DEFAULT_SIZE = 300
const DEFAULT_INTERVAL = 300
const MAX_FRAGMENT_LENGTH = 200
const QR_BACKGROUND_COLOR = '#fff'

// Web renders the animated QR through @keystonehq/animated-qr, which relies on
// qrcode.react (browser canvas) and is therefore web-only. The native variant
// generates the same UR fragments with @ngraveio/bc-ur + react-native-qrcode-svg.
const AnimatedQrCode = ({
  type,
  cbor,
  size = DEFAULT_SIZE,
  interval = DEFAULT_INTERVAL
}: AnimatedQrCodeProps) => (
  <View
    style={[
      flexbox.center,
      spacings.pSm,
      { width: size, height: size, backgroundColor: QR_BACKGROUND_COLOR }
    ]}
  >
    <AnimatedQRCode
      options={{
        capacity: MAX_FRAGMENT_LENGTH,
        interval,
        // AnimatedQRCode already adds 5px of white space on every side.
        size: size - SPACING_SM * 2
      }}
      type={type}
      cbor={cbor}
    />
  </View>
)

export default React.memo(AnimatedQrCode)
