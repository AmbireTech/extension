import React, { FC, memo } from 'react'
import { Image, View } from 'react-native'
import { SvgUri, SvgXml } from 'react-native-svg'

type Props = {
  setImageFetchFailed: React.Dispatch<React.SetStateAction<boolean>>
  avatar: string | undefined
  size?: number
  borderRadius?: number
}

const EnsAvatar: FC<Props> = ({ avatar, setImageFetchFailed, size, borderRadius }) => {
  if (!avatar) return null

  const isSvgDataUrl = avatar.startsWith('data:image/svg+xml')
  const isSvgUrl = avatar.toLowerCase().endsWith('.svg') || avatar.toLowerCase().includes('.svg?')

  if (isSvgDataUrl) {
    let xml = ''
    try {
      if (avatar.startsWith('data:image/svg+xml;base64,')) {
        const base64 = avatar.split('data:image/svg+xml;base64,')[1]

        xml = atob(base64!)
      } else if (avatar.startsWith('data:image/svg+xml;utf8,')) {
        xml = decodeURIComponent(avatar.split('data:image/svg+xml;utf8,')[1]!)
      } else if (avatar.startsWith('data:image/svg+xml,')) {
        xml = decodeURIComponent(avatar.split('data:image/svg+xml,')[1]!)
      }
    } catch (e) {
      setImageFetchFailed(true)
      return null
    }

    if (xml) {
      return (
        <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
          <SvgXml xml={xml} width={size} height={size} />
        </View>
      )
    }
  }

  if (isSvgUrl) {
    return (
      <View style={{ width: size, height: size, borderRadius, overflow: 'hidden' }}>
        <SvgUri
          uri={avatar}
          width={size}
          height={size}
          onError={() => setImageFetchFailed(true)}
          onLoad={() => setImageFetchFailed(false)}
        />
      </View>
    )
  }

  return (
    <Image
      source={{ uri: avatar }}
      style={{ width: size, height: size, borderRadius }}
      resizeMode="contain"
      onError={() => setImageFetchFailed(true)}
      onLoad={() => setImageFetchFailed(false)}
    />
  )
}

export default memo(EnsAvatar)
