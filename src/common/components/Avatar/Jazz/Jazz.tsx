import React from 'react'
import { Image } from 'react-native'

import Jazzicon from '@raugfer/jazzicon'

// builds an image data url for embedding
function buildDataUrl(address: string): string {
  return `data:image/svg+xml;base64,${btoa(Jazzicon(address))}`
}

// sample code for react component
export default function JazzIcon({
  address,
  size,
  borderRadius
}: {
  address: string
  size: number
  borderRadius: number
}) {
  const imageUrl = buildDataUrl(address)
  return (
    <Image
      source={{ uri: imageUrl }}
      style={{
        width: size,
        height: size,
        borderRadius
      }}
    />
  )
}
