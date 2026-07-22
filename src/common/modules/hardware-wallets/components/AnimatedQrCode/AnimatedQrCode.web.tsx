import React from 'react'

import { AnimatedQRCode } from '@keystonehq/animated-qr'

import { AnimatedQrCodeProps } from './AnimatedQrCode'

const DEFAULT_SIZE = 300
const DEFAULT_INTERVAL = 300

// Web renders the animated QR through @keystonehq/animated-qr, which relies on
// qrcode.react (browser canvas) and is therefore web-only. The native variant
// generates the same UR fragments with @ngraveio/bc-ur + react-native-qrcode-svg.
const AnimatedQrCode = ({
  type,
  cbor,
  size = DEFAULT_SIZE,
  interval = DEFAULT_INTERVAL
}: AnimatedQrCodeProps) => <AnimatedQRCode options={{ size, interval }} type={type} cbor={cbor} />

export default React.memo(AnimatedQrCode)
