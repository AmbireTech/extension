import React, { FC, memo } from 'react'
import { Image } from 'react-native'

type Props = {
  setImageFetchFailed: React.Dispatch<React.SetStateAction<boolean>>
  avatar: string | undefined
  size?: number
  borderRadius?: number
}

const EnsAvatar: FC<Props> = ({ avatar, setImageFetchFailed, size, borderRadius }) => {
  return (
    <Image
      source={{ uri: avatar }}
      style={{ width: size, height: size, borderRadius }}
      resizeMode="contain"
      onError={() => setImageFetchFailed(true)}
    />
  )
}

export default memo(EnsAvatar)
