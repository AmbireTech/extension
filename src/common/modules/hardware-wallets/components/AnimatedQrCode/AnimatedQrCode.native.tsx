import { UR, UREncoder } from '@ngraveio/bc-ur'
import { Buffer } from 'buffer'
import React, { useEffect, useMemo, useState } from 'react'
import { View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import { SPACING_MD } from '@common/styles/spacings'

import { AnimatedQrCodeProps } from './AnimatedQrCode'

const DEFAULT_SIZE = 300
const DEFAULT_INTERVAL = 300
const MAX_FRAGMENT_LENGTH = 200
const QR_BACKGROUND_COLOR = '#fff'
const QR_FOREGROUND_COLOR = '#000'

// Native counterpart of the web AnimatedQRCode. Encodes the same UR payload
// (type + cbor) into multi-part fragments and cycles them on an interval,
// rendering each frame with react-native-qrcode-svg.
const AnimatedQrCode = ({
  type,
  cbor,
  size = DEFAULT_SIZE,
  interval = DEFAULT_INTERVAL
}: AnimatedQrCodeProps) => {
  const encoder = useMemo(
    () => new UREncoder(new UR(Buffer.from(cbor, 'hex'), type), MAX_FRAGMENT_LENGTH),
    [cbor, type]
  )
  // The initializer renders the first fragment; the interval advances the rest.
  const [frame, setFrame] = useState(() => encoder.nextPart().toUpperCase())

  useEffect(() => {
    const id = setInterval(() => setFrame(encoder.nextPart().toUpperCase()), interval)

    return () => clearInterval(id)
  }, [encoder, interval])

  return (
    <View>
      <QRCode
        value={frame}
        size={size}
        quietZone={SPACING_MD}
        color={QR_FOREGROUND_COLOR}
        backgroundColor={QR_BACKGROUND_COLOR}
        ecl="L"
      />
    </View>
  )
}

export default React.memo(AnimatedQrCode)
