import { FC, ReactNode } from 'react'
import { TextProps, ViewStyle } from 'react-native'

export type EnsAvatarProps = {
  setEnsAvatarImageState: React.Dispatch<React.SetStateAction<'loading' | 'loaded' | 'failed'>>
  avatar: string | undefined
  size?: number
  borderRadius?: number
}

declare const EnsAvatar: FC<EnsAvatarProps>
export default EnsAvatar
