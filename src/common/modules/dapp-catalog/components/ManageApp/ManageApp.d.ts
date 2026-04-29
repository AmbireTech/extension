import React from 'react'
import { Pressable, ViewStyle } from 'react-native'

import { Dapp } from '@ambire-common/interfaces/dapp'

export interface ManageAppProps {
  dapp: Dapp
  children: React.ReactNode
  withCurrentAccount?: boolean
  isParentHovered?: boolean
  buttonProps?: Omit<React.ComponentProps<typeof Pressable>, 'onPress' | 'ref'>
  style?: ViewStyle
  /**
   * Fires after the popover/bottom sheet has fully closed. Used by callers that
   * need to react to the modal closing — e.g. the dapp WebView synthesizing a
   * `window.focus` event so libraries that rely on focus-based refetching
   * (React Query's `refetchOnWindowFocus`) re-evaluate stale state.
   */
  onClosed?: () => void
}

declare const ManageApp: React.FC<ManageAppProps>

export default ManageApp
