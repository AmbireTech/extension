import React, { FC, memo } from 'react'
import { Image } from 'react-native'

import SkeletonLoader from '@common/components/SkeletonLoader'

type Props = {
  isLoading: boolean
  setImageFetchFailed: React.Dispatch<React.SetStateAction<boolean>>
  avatar: string | undefined
  size?: number
  borderRadius?: number
}

const EnsAvatar: FC<Props> = ({ isLoading, avatar, setImageFetchFailed, size, borderRadius }) => {
  return !isLoading ? (
    <Image
      source={{ uri: avatar }}
      style={{ width: size, height: size, borderRadius }}
      resizeMode="contain"
      onError={() => setImageFetchFailed(true)}
    />
  ) : (
    <SkeletonLoader width={size} height={size} borderRadius={borderRadius} />
  )
}

export default memo(EnsAvatar)
