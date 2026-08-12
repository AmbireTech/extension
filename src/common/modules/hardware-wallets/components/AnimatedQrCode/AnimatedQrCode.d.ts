import { FC } from 'react'

export interface AnimatedQrCodeProps {
  type: string
  cbor: string
  size?: number
  interval?: number
  /**
   * Bytes per QR fragment. Bigger fragments mean fewer frames (so a shorter loop for
   * large payloads), but a denser QR code that is harder for a camera to decode.
   */
  capacity?: number
}

declare const AnimatedQrCode: FC<AnimatedQrCodeProps>

export default AnimatedQrCode
