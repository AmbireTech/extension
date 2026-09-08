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
  /**
   * White margin around the code, included in `size` (so a smaller quiet zone means
   * bigger, easier to scan modules). Pass 0 when the surrounding background is white
   * already and can serve as the quiet zone itself. Web defaults to 32 pixels for stronger
   * separation from dark surrounding surfaces.
   */
  quietZone?: number
}

declare const AnimatedQrCode: FC<AnimatedQrCodeProps>

export default AnimatedQrCode
