import { FC } from 'react'

export interface AnimatedQrCodeProps {
  type: string
  cbor: string
  size?: number
  interval?: number
}

declare const AnimatedQrCode: FC<AnimatedQrCodeProps>

export default AnimatedQrCode
