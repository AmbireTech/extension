import React from 'react'
import { Pressable, ViewStyle } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'

export interface ManageAppProps {
  dapp: Dapp
  children: React.ReactNode
  isParentHovered?: boolean
  buttonProps?: Omit<React.ComponentProps<typeof Pressable>, 'onPress' | 'ref'>
  style?: ViewStyle
  onClosed?: () => void
}

declare const ManageApp: React.FC<ManageAppProps>

export default ManageApp
