import React, { FC, memo } from 'react'
import { Image } from 'react-native'

import { EnsAvatarProps } from '@common/components/Avatar/EnsAvatar/EnsAvatar'

const EnsAvatar: FC<EnsAvatarProps> = ({ avatar, setEnsAvatarImageState, size, borderRadius }) => {
  return (
    <Image
      source={{ uri: avatar }}
      style={{ width: size, height: size, borderRadius }}
      resizeMode="contain"
      onError={() => setEnsAvatarImageState('failed')}
      onLoad={() => setEnsAvatarImageState('loaded')}
    />
  )
}

export default memo(EnsAvatar)
