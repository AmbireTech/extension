import React from 'react'
import { Control } from 'react-hook-form'

export interface FloatingBottomBarProps {
  control: Control<{ search: string }, any>
  displayCurrentApp?: boolean
  displayNetworkFilter?: boolean
  isHidden: boolean
}

declare const FloatingBottomBar: React.FC<FloatingBottomBarProps>
export default FloatingBottomBar
